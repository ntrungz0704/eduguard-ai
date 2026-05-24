const path = require('path');
const fs = require('fs');


const { routeIntent } = require('./intentRouter');
const { resolveContext } = require('./contextResolver');
const { validateRole } = require('./roleValidator');
const { extractAllEntities } = require('./entityExtractor');
const { getSession } = require('./sessionMemory');
const { executeDecision } = require('./aiDecisionEngine');
const { buildResponse } = require('./responseBuilder');
const { guardConfidence } = require('./confidenceGuard');
const appLogger = require('../../infrastructure/logger');

// ─── NLP: Orchestrator does not own the NLP model.
// nlpIntent is resolved upstream by api.js (which has the trained manager)
// and passed in via req.body or headers. Graceful fallback to keyword routing.


// ============================================================
// EduGuard AI — Chatbot Orchestrator
// The single entry point for the chatbot pipeline:
// Input → IntentRouter → ContextResolver → RoleValidator
//       → EntityExtractor → AIDecisionEngine → ResponseBuilder
// ============================================================

/**
 * Orchestrate the full chatbot pipeline for a request.
 *
 * @param {object} req - Express request object
 * @param {string} sessionId - Unique session identifier
 * @returns {Promise<{
 *   reply: string,
 *   chartData: string|null,
 *   actions: string[]|null,
 *   intent: string,
 *   activeMssv: string|null,
 *   sessionId: string,
 *   riskData: object|null
 * }>}
 */
async function orchestrateChatbot(req, sessionId) {
  const startTime = Date.now();
  const message = req.body?.message || '';
  const userRole = req.headers['x-user-role'] || 'TEACHER';
  const userId = req.headers['x-user-id'];

  // ─── Step 1: Get/Create Session ──────────────────────────
  const session = getSession(sessionId, userRole);
  appLogger.session('Request received', sessionId, { role: userRole, userId });

  // ─── Step 2: NLP Intent Detection ───────────────────────
  // nlpIntent pre-computed by api.js NLP manager and forwarded via req.body
  const nlpIntentRaw = req.body?.nlpIntent || 'None';
  const nlpScore = req.body?.nlpScore || 0;
  const nlpClassifications = req.body?.nlpClassifications || [];
  
  const { finalIntent: nlpIntent, secondaryIntent } = guardConfidence(nlpIntentRaw, nlpScore, nlpClassifications);
  if (nlpIntentRaw !== 'None' && nlpIntent === 'FALLBACK_INTENT') {
    appLogger.info(`[NLP_GUARD] Blocked intent ${nlpIntentRaw} due to low confidence (${nlpScore})`);
  }
  
  appLogger.intentTrace(message, nlpIntent, 'pending', sessionId);


  // ─── Step 3: Context Resolution ─────────────────────────
  const context = resolveContext(req, session);
  const { activeMssv, isStudent, userRole: resolvedRole } = context;

  // ─── Step 4: Entity Extraction ──────────────────────────
  const entities = extractAllEntities(message);

  // Use entity MSSV if context couldn't resolve one
  const effectiveMssv = activeMssv || entities.mssv;
  if (entities.mssv && !activeMssv) {
    session.activeStudent = entities.mssv;
    appLogger.session(`Active student set via entity extraction: ${entities.mssv}`, sessionId);
  }

  // ─── Step 5: Intent Routing ──────────────────────────────
  const intent = routeIntent(message, nlpIntent, effectiveMssv);
  session.lastIntent = intent;
  appLogger.aiRouter(intent, effectiveMssv, { sessionId, nlpIntent });
  appLogger.intentTrace(message, nlpIntent, intent, sessionId);

  // ─── Step 6: Role Validation ─────────────────────────────
  const validation = validateRole(resolvedRole, effectiveMssv, userId, intent);
  if (!validation.allowed) {
    appLogger.security(
      `Blocked ${intent} for ${resolvedRole}`,
      userId || 'unknown',
      { intent, targetMssv: effectiveMssv }
    );
    const duration = Date.now() - startTime;
    appLogger.request('POST', '/api/chatbot', 403, duration, req.traceId);
    return {
      reply: validation.reason,
      chartData: null,
      actions: null,
      intent,
      activeMssv: session.activeStudent,
      sessionId,
      riskData: null
    };
  }

  // ─── Step 7: AI Decision Engine ──────────────────────────
  let decisionData;
  try {
    decisionData = await executeDecision({
      intent,
      activeMssv: effectiveMssv,
      entities,
      session
    });
    
    // Save lastTopStudents to session for Contextual Follow-up
    if (decisionData.topAtRisk && decisionData.topAtRisk.length > 0) {
      session.lastTopStudents = decisionData.topAtRisk.map(s => s.mssv);
      appLogger.session(`Saved lastTopStudents for follow-up context`, sessionId);
    } else if (decisionData.analytics && decisionData.analytics.topAtRisk && decisionData.analytics.topAtRisk.length > 0) {
      session.lastTopStudents = decisionData.analytics.topAtRisk.map(s => s.mssv);
      appLogger.session(`Saved lastTopStudents for follow-up context`, sessionId);
    }
  } catch (err) {
    appLogger.error(`[AI_ORCHESTRATOR] Decision engine error: ${err.message}`, { stack: err.stack });
    decisionData = { type: 'FALLBACK', activeMssv: effectiveMssv };
  }

  // ─── Step 8: Build Response ───────────────────────────────
  const { text, chartData, actions } = buildResponse(decisionData);

  // Update session state
  session.lastIntent = intent;
  if (decisionData?.student?.mssv) {
    session.activeStudent = decisionData.student.mssv;
    session.lastRiskLevel = decisionData.riskData?.level || null;
  }
  if (decisionData?.analytics?.bottleneckSubjects?.length > 0) {
    session.lastSubject = decisionData.analytics.bottleneckSubjects[0].courseId;
  }

  const duration = Date.now() - startTime;
  appLogger.request('POST', '/api/chatbot', 200, duration, req.traceId);
  appLogger.info(`[NLP_ORCHESTRATOR] Pipeline complete in ${duration}ms | Intent: ${intent}`);

  return {
    reply: text,
    chartData: chartData || null,
    actions: actions || null,
    intent,
    activeMssv: session.activeStudent,
    sessionId,
    riskData: decisionData?.riskData || null,
    processingTimeMs: duration
  };
}

module.exports = {
  orchestrateChatbot
};
