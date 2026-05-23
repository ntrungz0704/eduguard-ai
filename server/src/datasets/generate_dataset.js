const fs = require('fs');
const path = require('path');

function generateDataset(numRecords = 1000) {
    const dataset = [];
    
    for (let i = 0; i < numRecords; i++) {
        // Randomize features
        const attendance = Math.floor(Math.random() * (100 - 30 + 1)) + 30; // 30% to 100%
        const quizAvg = Number((Math.random() * (10 - 2) + 2).toFixed(1)); // 2.0 to 10.0
        const labAvg = Number((Math.random() * (10 - 2) + 2).toFixed(1)); // 2.0 to 10.0
        const failedSubjects = Math.floor(Math.random() * 6); // 0 to 5
        const dependencyImpact = Math.floor(Math.random() * 10); // 0 to 9

        // Calculate a hidden logic for label to make the model actually learn something
        let riskProbability = 0.05; // base 5%
        if (attendance < 65) riskProbability += 0.4;
        if (quizAvg < 5.0) riskProbability += 0.3;
        if (labAvg < 5.0) riskProbability += 0.2;
        if (failedSubjects >= 2) riskProbability += 0.4;
        if (dependencyImpact >= 4) riskProbability += 0.2;

        const risk = Math.random() < riskProbability ? 1 : 0;

        dataset.push({
            attendance,
            quizAvg,
            labAvg,
            failedSubjects,
            dependencyImpact,
            risk
        });
    }

    const filePath = path.join(__dirname, 'students_dataset.json');
    fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2));
    console.log(`✅ Đã tạo thành công dataset giả lập: ${numRecords} sinh viên tại ${filePath}`);
}

// Nếu chạy trực tiếp từ command line
if (require.main === module) {
    generateDataset(1000);
}

module.exports = { generateDataset };
