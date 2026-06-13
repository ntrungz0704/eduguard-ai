const path = require('path');
const fs = require('fs');


const { routeIntent } = require('./intentRouter');
const { resolveContext } = require('./contextResolver');
const { validateRole } = require('./roleValidator');
const { extractAllEntities } = require('./entityExtractor');
const { getSession, addConversationTurn, updateBrain, loadStudentMemoryFromDB, saveStudentMemoryToDB } = require('./sessionMemory');
const { executeDecision } = require('./aiDecisionEngine');
const { executeStudentDecision } = require('./studentEngine');
const { buildTeacherResponse } = require('./response/teacherResponseBuilder');
const { buildStudentResponse } = require('./response/studentResponseBuilder');
const { guardConfidence } = require('./confidenceGuard');
const academicGraphEngine = require('../advisor/academicGraphEngine');
const { routeStudentIntent } = require('./studentIntentRouter');
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
  const userRole = req.user?.role || req.headers['x-user-role'] || 'TEACHER';
  const userId = req.user?.id || req.headers['x-user-id'];

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
  console.log('[DEBUG] Extracted entities:', JSON.stringify(entities));

  // Use entity MSSV if context couldn't resolve one
  const effectiveMssv = activeMssv || entities.mssv;
  if (entities.mssv && !activeMssv) {
    session.activeStudent = entities.mssv;
    appLogger.session(`Active student set via entity extraction: ${entities.mssv}`, sessionId);
  }

  // ─── Step 4.5: Load Persistent Brain from DB ────────────
  if (isStudent && effectiveMssv && !session.brainLoaded) {
    await loadStudentMemoryFromDB(session, effectiveMssv);
    session.brainLoaded = true;
  }

  // ─── Step 5: Intent Routing ──────────────────────────────
  let intent, decisionData, text, chartData, actions;

  if (isStudent) {
    // ─── STUDENT BRANCH ──────────────────────────────
    intent = routeStudentIntent(message, nlpIntent, sessionId);
    session.lastIntent = intent;
    appLogger.aiRouter(intent, effectiveMssv, { sessionId, nlpIntent, role: 'STUDENT' });
    appLogger.intentTrace(message, nlpIntent, intent, sessionId);

    try {
      decisionData = await executeStudentDecision({ intent, activeMssv: effectiveMssv, entities, session, message });
    } catch (err) {
      appLogger.error(`[STUDENT_ENGINE] Error: ${err.message}`, { stack: err.stack });
      decisionData = { type: 'STUDENT_FALLBACK', activeMssv: effectiveMssv };
    }

    // ─── ACADEMIC REASONING INJECTION ────────────────
    if (decisionData.student && session.brain) {
      // Sync basic DB fields to Brain v4
      session.brain.studentId = decisionData.student.mssv || decisionData.student.id;
      session.brain.gpa = decisionData.riskData?.gpa || null;

      const scores = decisionData.student.scores || [];
      const courseStatus = decisionData.student.courseStatus || {};

      session.brain.failedCourses = scores.length > 0
        ? scores.filter(s => s.status === 'FAILED' || s.value < 5.0).map(s => s.courseId)
        : Object.keys(courseStatus).filter(c => courseStatus[c] === 'FAILED');

      session.brain.completedCourses = scores.length > 0
        ? scores.filter(s => s.status === 'PASSED' || s.value >= 5.0).map(s => s.courseId)
        : Object.keys(courseStatus).filter(c => courseStatus[c] === 'PASSED');

      session.brain.predictions = decisionData.student.predictions || [];

      const reasoningReport = academicGraphEngine.generateReasoningReport(session.brain);
      decisionData.reasoningReport = reasoningReport;

      appLogger.info(`[REASONING] Generated academic graph report for ${effectiveMssv}`);
    }
    // ─────────────────────────────────────────────────

    const responseObj = buildStudentResponse(decisionData);
    text = responseObj.text;
    chartData = responseObj.chartData;
    actions = responseObj.actions;

    // Update Student Brain with context from this interaction
    updateBrain(session, intent, decisionData);
    
    // Save updated context back to DB
    if (effectiveMssv) {
      await saveStudentMemoryToDB(session, effectiveMssv);
      const { prisma } = require('../../infrastructure/database/prisma');
      await prisma.conversationHistory.create({
        data: {
          studentId: effectiveMssv,
          role: 'USER',
          message: message,
          intent: intent,
          entities: JSON.stringify(entities)
        }
      });
      await prisma.conversationHistory.create({
        data: {
          studentId: effectiveMssv,
          role: 'BOT',
          message: text,
          intent: intent
        }
      });
    }

  } else {
    // ─── TEACHER/ADMIN BRANCH ────────────────────────
    intent = routeIntent(message, nlpIntent, effectiveMssv);
    session.lastIntent = intent;
    appLogger.aiRouter(intent, effectiveMssv, { sessionId, nlpIntent });
    appLogger.intentTrace(message, nlpIntent, intent, sessionId);

    // Step 6: Role Validation
    const validation = validateRole(resolvedRole, effectiveMssv, userId, intent);
    if (!validation.allowed) {
      appLogger.security(`Blocked ${intent} for ${resolvedRole}`, userId || 'unknown', { intent, targetMssv: effectiveMssv });
      const duration = Date.now() - startTime;
      appLogger.request('POST', '/api/chatbot', 403, duration, req.traceId);
      return { reply: validation.reason, chartData: null, actions: null, intent, activeMssv: session.activeStudent, sessionId, riskData: null };
    }

    // Step 7: AI Decision Engine
    try {
      decisionData = await executeDecision({ intent, activeMssv: effectiveMssv, entities, session });
      if (decisionData.topAtRisk && decisionData.topAtRisk.length > 0) {
        session.lastTopStudents = decisionData.topAtRisk.map(s => s.mssv);
      } else if (decisionData.analytics && decisionData.analytics.topAtRisk && decisionData.analytics.topAtRisk.length > 0) {
        session.lastTopStudents = decisionData.analytics.topAtRisk.map(s => s.mssv);
      }
    } catch (err) {
      appLogger.error(`[AI_ORCHESTRATOR] Decision engine error: ${err.message}`, { stack: err.stack });
      decisionData = { type: 'FALLBACK', activeMssv: effectiveMssv };
    }

    // Step 8: Build Response
    const responseObj = buildTeacherResponse(decisionData);
    text = responseObj.text;
    chartData = responseObj.chartData;
    actions = responseObj.actions;
    
    // Save teacher chat history to DB if active student is selected
    if (session.activeStudent || effectiveMssv) {
      const dbStudentId = session.activeStudent || effectiveMssv;
      try {
        const { prisma } = require('../../infrastructure/database/prisma');
        await prisma.conversationHistory.create({
          data: {
            studentId: dbStudentId,
            role: 'TEACHER_USER',
            message: message,
            intent: intent,
            entities: JSON.stringify(entities)
          }
        });
        await prisma.conversationHistory.create({
          data: {
            studentId: dbStudentId,
            role: 'TEACHER_BOT',
            message: text,
            intent: intent
          }
        });
      } catch (err) {
        appLogger.error(`[HISTORY] Failed to save teacher chat history: ${err.message}`);
      }
    }
  }

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

  // Track conversation history
  addConversationTurn(session, message, intent, session.activeStudent);

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
