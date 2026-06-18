const row = {
    rowStatus: 'PASSED',
    score: 10,
    course: 'COM1071',
    semester: 'Summer 2025'
};

let status = row.rowStatus;
let scoreValue = row.score;

if (status === 'STUDYING' || status === 'NOT_STARTED') {
    scoreValue = null;
} else if (!status) {
    if (scoreValue === null || scoreValue === undefined) {
        status = 'STUDYING';
        scoreValue = null;
    } else {
        status = (scoreValue >= 5.0 || scoreValue === 1.0) ? 'PASSED' : 'FAILED';
    }
}

console.log("Publish Status:", status);
console.log("Publish ScoreValue:", scoreValue);
