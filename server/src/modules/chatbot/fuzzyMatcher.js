// ============================================================
// EduGuard AI — Fuzzy Matcher v1.0
// Levenshtein Distance-based fuzzy matching for typo tolerance
// Zero external dependencies — pure JavaScript implementation
// ============================================================

/**
 * Calculate Levenshtein distance between two strings.
 * Time: O(m*n), Space: O(min(m,n))
 * @param {string} a 
 * @param {string} b 
 * @returns {number} Edit distance
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Use shorter string as inner loop for space optimization
  if (a.length > b.length) [a, b] = [b, a];

  const aLen = a.length;
  const bLen = b.length;
  let prev = Array.from({ length: aLen + 1 }, (_, i) => i);
  let curr = new Array(aLen + 1);

  for (let j = 1; j <= bLen; j++) {
    curr[0] = j;
    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[i] = Math.min(
        prev[i] + 1,       // deletion
        curr[i - 1] + 1,   // insertion
        prev[i - 1] + cost  // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[aLen];
}

/**
 * Find the best fuzzy match for an input string from a dictionary.
 * @param {string} input - The misspelled/fuzzy input
 * @param {string[]} dictionary - Array of correct terms to match against
 * @param {number} maxDistance - Maximum allowed edit distance (default: 2)
 * @returns {{ match: string, distance: number } | null}
 */
function fuzzyMatch(input, dictionary, maxDistance = 2) {
  if (!input || !dictionary || dictionary.length === 0) return null;
  
  const normalized = input.toLowerCase().trim();
  if (normalized.length < 2) return null; // Too short to fuzzy match

  let bestMatch = null;
  let bestDistance = Infinity;

  for (const term of dictionary) {
    const termLower = term.toLowerCase();
    
    // Quick length check — if lengths differ by more than maxDistance, skip
    if (Math.abs(normalized.length - termLower.length) > maxDistance) continue;
    
    // Thêm logic loại trừ chữ viết tắt
    if (termLower.length <= 3) {
      if (normalized === termLower) {
        return { match: term, distance: 0 };
      }
      continue; // Không cho phép match mờ chữ ngắn (ví dụ: 'fe', 'be', 'qa')
    }

    const dist = levenshtein(normalized, termLower);
    
    // Chỉnh lại Rule
    const allowedDistance = termLower.length < 6 ? 1 : maxDistance;

    if (dist <= allowedDistance && dist < bestDistance) {
      bestDistance = dist;
      bestMatch = term;
      
      // Perfect match found, no need to continue
      if (dist === 0) break;
    }
  }

  return bestMatch ? { match: bestMatch, distance: bestDistance } : null;
}

/**
 * Find fuzzy match and resolve to canonical name using a synonym map.
 * @param {string} input - The misspelled input (e.g. "fronent")
 * @param {Map} lookupMap - The synonym lookup map from synonymEngine
 * @param {number} maxDistance - Maximum edit distance (default: 2)
 * @returns {{ canonical: string, matchedAlias: string, distance: number } | null}
 */
function fuzzyResolve(input, lookupMap, maxDistance = 2) {
  if (!input || !lookupMap) return null;
  
  const normalized = input.toLowerCase().trim();
  
  // First check exact match
  if (lookupMap.has(normalized)) {
    return { canonical: lookupMap.get(normalized), matchedAlias: normalized, distance: 0 };
  }
  
  // Build dictionary from map keys
  const dictionary = Array.from(lookupMap.keys());
  const result = fuzzyMatch(normalized, dictionary, maxDistance);
  
  if (result) {
    return {
      canonical: lookupMap.get(result.match),
      matchedAlias: result.match,
      distance: result.distance
    };
  }
  
  return null;
}

/**
 * Extract the best fuzzy career match from a full message.
 * Scans each word and bi-gram in the message for potential matches.
 * @param {string} message - Full user message
 * @param {Map} careerLookup - Career synonym lookup map
 * @param {number} maxDistance - Maximum edit distance
 * @returns {{ canonical: string, matchedAlias: string, distance: number } | null}
 */
function fuzzyExtractFromMessage(message, careerLookup, maxDistance = 2) {
  if (!message) return null;
  const words = message.toLowerCase().trim().split(/\s+/);
  
  let bestResult = null;
  let bestDistance = Infinity;
  
  // Check individual words
  for (const word of words) {
    if (word.length < 2) continue;
    const result = fuzzyResolve(word, careerLookup, maxDistance);
    if (result && result.distance < bestDistance) {
      bestDistance = result.distance;
      bestResult = result;
      if (bestDistance === 0) return bestResult;
    }
  }
  
  // Check bi-grams (2-word combinations like "react native", "full stack")
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    const result = fuzzyResolve(bigram, careerLookup, maxDistance);
    if (result && result.distance < bestDistance) {
      bestDistance = result.distance;
      bestResult = result;
      if (bestDistance === 0) return bestResult;
    }
  }
  
  // Check tri-grams for longer names (e.g. "ai full stack")
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    const result = fuzzyResolve(trigram, careerLookup, maxDistance);
    if (result && result.distance < bestDistance) {
      bestDistance = result.distance;
      bestResult = result;
      if (bestDistance === 0) return bestResult;
    }
  }
  
  return bestResult;
}

module.exports = {
  levenshtein,
  fuzzyMatch,
  fuzzyResolve,
  fuzzyExtractFromMessage
};
