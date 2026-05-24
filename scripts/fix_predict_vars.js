const fs = require('fs');

const predictFile = 'client/src/pages/Predict.jsx';
let content = fs.readFileSync(predictFile, 'utf8');

content = content.replace(/pearsonLoading/g, 'graphLoading');
content = content.replace(/setPearsonLoading/g, 'setGraphLoading');
content = content.replace(/pearsonData/g, 'graphData');
content = content.replace(/setPearsonData/g, 'setGraphData');
content = content.replace(/pearsonFilter/g, 'graphFilter');
content = content.replace(/setPearsonFilter/g, 'setGraphFilter');
content = content.replace(/fetchPearsonMatrix/g, 'fetchDependencyGraph');
content = content.replace(/Pearson correlation matrix state/g, 'Dependency Graph state');
content = content.replace(/Pearson Correlation Matrix/g, 'Dependency Graph Matrix');

fs.writeFileSync(predictFile, content, 'utf8');
console.log('Fixed Predict.jsx variable mismatch');
