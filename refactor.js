const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'server', 'routes', 'api.js');
let content = fs.readFileSync(apiPath, 'utf8');

// 1. Remove variable declarations
content = content.replace(/let trainingData = \{ students: \[\], subjects: \[\], curriculumOrder: \[\] \};/g, 'const cache = require(\'../src/shared/cache\');');
content = content.replace(/let modelCache = \{\};/g, '');
content = content.replace(/let uploadedStudents = \[\];/g, '');

// 2. Replace assignments
content = content.replace(/trainingData = JSON\.parse/g, 'cache.trainingData = JSON.parse');
content = content.replace(/uploadedStudents = mergedValidStudents/g, 'cache.uploadedStudents = mergedValidStudents');
content = content.replace(/uploadedStudents = students/g, 'cache.uploadedStudents = students');

// 3. Replace usages globally
content = content.replace(/\btrainingData\b/g, 'cache.trainingData');
content = content.replace(/\bmodelCache\b/g, 'cache.modelCache');
content = content.replace(/\buploadedStudents\b/g, 'cache.uploadedStudents');

// 4. Fix double cache.cache replacements just in case
content = content.replace(/cache\.cache\./g, 'cache.');

fs.writeFileSync(apiPath, content, 'utf8');
console.log('Refactored api.js to use cache!');
