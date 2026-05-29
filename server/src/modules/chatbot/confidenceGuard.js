// ============================================================
// EduGuard AI — Confidence Guard
// Prevents AI hallucination by enforcing a minimum confidence score
// ============================================================

const CONFIDENCE_THRESHOLD = 0.70;

/**
 * Validates the NLP intent score.
 * If the score is below the threshold, it reverts the intent to FALLBACK.
 * Also checks for potential multi-intent scenarios.
 * 
 * @param {string} intent - The primary intent
 * @param {number} score - The confidence score
 * @param {Array} classifications - Array of all classified intents with scores
 * @returns {{ finalIntent: string, secondaryIntent: string|null }}
 */
function guardConfidence(intent, score, classifications) {
  if (intent === 'None' || score < CONFIDENCE_THRESHOLD) {
    return { finalIntent: 'FALLBACK_INTENT', secondaryIntent: null };
  }

  let secondaryIntent = null;
  // Multi-intent detection: if the second highest intent is also strong
  if (classifications && classifications.length > 1) {
    const second = classifications[1];
    if (second.score > 0.5 && second.intent !== 'None') {
      secondaryIntent = second.intent;
    }
  }

  return { finalIntent: intent, secondaryIntent };
}

module.exports = {
  guardConfidence,
  CONFIDENCE_THRESHOLD
};
