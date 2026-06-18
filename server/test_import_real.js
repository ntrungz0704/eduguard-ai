const importController = require('./src/modules/data/import.controller');
const xlsx = require('xlsx');

// 1. Create a dummy excel file in memory
const wb = xlsx.utils.book_new();
const wsData = [
  ['Mã môn', 'Mã chuyển đổi', 'Số tín chỉ', 'Thang điểm 10', 'Thang điểm 4', 'Điểm chữ', 'Trạng thái', 'MSSV'],
  ['COM1071', 'COM107', 3, 10, 4, 'A+', 'Passed', 'PS47503'],
  ['WEB1013', 'WEB101', 3, 10, 4, 'A+', 'Passed', 'PS47503']
];
const ws = xlsx.utils.aoa_to_sheet(wsData);
xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

async function test() {
  console.log('--- RUNNING PREVIEW ---');
  let publishedData = null;
  const reqPreview = {
    file: { buffer: buf, originalname: 'test.xlsx', size: buf.length },
    body: {}
  };
  
  const resPreview = {
    json: (data) => {
      console.log('PREVIEW JSON:', JSON.stringify(data, null, 2));
      publishedData = data;
    },
    status: (code) => {
      console.log('PREVIEW STATUS:', code);
      return { json: (data) => console.log('PREVIEW STATUS JSON:', data) };
    }
  };
  
  await importController.previewData(reqPreview, resPreview);

  if (publishedData && publishedData.success) {
    console.log('--- RUNNING PUBLISH ---');
    const reqPublish = {
      user: { email: 'test@example.com' },
      body: {
        data: publishedData.data,
        classCode: 'WD18301',
        fileHash: `MOCK_HASH_${Date.now()}`
      }
    };

    const resPublish = {
      json: (data) => console.log('PUBLISH JSON:', JSON.stringify(data, null, 2)),
      status: (code) => {
        console.log('PUBLISH STATUS:', code);
        return { json: (data) => console.log('PUBLISH STATUS JSON:', data) };
      }
    };
    
    await importController.publishData(reqPublish, resPublish);
  }
}

test().catch(console.error).finally(() => require('./src/infrastructure/database/prisma').prisma.$disconnect());
