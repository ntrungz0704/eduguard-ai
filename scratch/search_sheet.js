const fs = require('fs');
const readline = require('readline');

async function search() {
  const logPath = 'C:\\Users\\ntrun\\.gemini\\antigravity\\brain\\455c53f6-664f-4302-90ee-127646309910\\.system_generated\\logs\\transcript.jsonl';
  if (!fs.existsSync(logPath)) return;

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('14K2vrJpbX-V54q96Xfc-nN3AA9IJ-3FV5EWMwInqdso')) {
      const obj = JSON.parse(line);
      console.log('--- STEP ---');
      console.log('Type:', obj.type);
      console.log('Source:', obj.source);
      console.log('Content snippet:', String(obj.content || '').substring(0, 1000));
    }
  }
}

search();
