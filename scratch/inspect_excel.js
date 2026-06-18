const xlsx = require('xlsx');

const filePath = 'e:\\my-project\\eduguard-ai\\server\\generated\\personal_transcripts\\PS40224_transcript.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

if (data.length > 0) {
    console.log("Headers:");
    console.log(Object.keys(data[0]));
    console.log("\nFirst Row:");
    console.log(data[0]);
} else {
    console.log("Sheet is empty");
}
