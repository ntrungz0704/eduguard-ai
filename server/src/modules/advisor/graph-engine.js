const knowledgeCache = require('../knowledge/cache');

exports.getImpactedCourses = (failedCourses) => {
  const riskChains = knowledgeCache.get('riskChains');
  if (!riskChains) throw new Error("Knowledge cache not loaded");

  const results = [];
  failedCourses.forEach(failed => {
    const code = failed.toUpperCase();
    const chain = riskChains[code];
    let impacted = [];
    if (chain && chain.impacts) {
      impacted = chain.impacts;
    }
    results.push({
      failedCourse: code,
      impactedCourses: impacted,
      impactCount: impacted.length
    });
  });

  return results; // Array of objects instead of flat string array
};
