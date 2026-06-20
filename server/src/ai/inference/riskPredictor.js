process.env.TF_CPP_MIN_LOG_LEVEL = '3';
const fs = require('fs');
const path = require('path');

let model = null;
let tf = null;

function getTF() {
    if (!tf) {
        tf = require("@tensorflow/tfjs");
    }
    return tf;
}

// Custom IOHandler to load model locally
function customFileHandler(modelDir) {
    return {
        load: async () => {
            const modelJSONPath = path.join(modelDir, 'model.json');
            const weightDataPath = path.join(modelDir, 'weights.bin');
            
            if (!fs.existsSync(modelJSONPath) || !fs.existsSync(weightDataPath)) {
                throw new Error("Model files not found");
            }
            
            const modelJSON = JSON.parse(fs.readFileSync(modelJSONPath, 'utf8'));
            const weightData = new Uint8Array(fs.readFileSync(weightDataPath)).buffer;
            
            return {
                modelTopology: modelJSON.modelTopology,
                weightSpecs: modelJSON.weightsManifest[0].weights,
                weightData: weightData
            };
        }
    };
}

async function loadModel() {
    console.log("🚀 [TFJS] Đang nạp Prototype ML Prediction Model...");
    const modelDir = path.join(__dirname, '..', 'training', 'risk_model'); // Trỏ tới thư mục vừa export
    
    try {
        const tfInstance = getTF();
        model = await tfInstance.loadLayersModel(customFileHandler(modelDir));
        console.log("✅ [TFJS] Tải mô hình thành công. ML Prediction Engine sẵn sàng.");
    } catch (err) {
        console.warn("⚠️ [TFJS] Chưa tìm thấy dữ liệu huấn luyện. Hãy chạy `npm run train`.");
        model = null;
    }
}

// Hàm dự đoán rủi ro (ML Prediction)
// Features: [gpa, failRate, attendance_rate, assignment_avg, quiz_avg, late_submission, missed_deadlines]
function predictRisk(gpa, failRate, attendance, assignAvg, quizAvg, lateSub, missedDeadlines) {
    if (!model) {
        // Fallback
        return 0;
    }
    
    const tfInstance = getTF();
    return tfInstance.tidy(() => {
        const inputTensor = tfInstance.tensor2d([[
            gpa,
            failRate,
            attendance,
            assignAvg,
            quizAvg,
            lateSub,
            missedDeadlines
        ]]);
        
        const prediction = model.predict(inputTensor);
        const riskScore = prediction.dataSync()[0]; // 0.0 -> 1.0
        return riskScore;
    });
}

module.exports = {
    loadModel,
    predictRisk
};
