// Centralized in-memory store for shared data across routes/modules
const cache = {
  trainingData: { students: [], subjects: [], curriculumOrder: [] },
  modelCache: {},
  uploadedStudents: [],
  interventions: {},
  getInterventions: () => cache.interventions
};

module.exports = cache;
