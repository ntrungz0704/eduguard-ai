const tf = require("@tensorflow/tfjs");
const fs = require('fs');
const path = require('path');

let model = null;

// Custom IOHandler to load model locally without using @tensorflow/tfjs-node C++ bindings
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
    console.log("🚀 [TFJS] Đang nạp mô hình Machine Learning (Inference Pipeline)...");
    const modelDir = path.join(__dirname, '..', 'models', 'tfjs');
    
    try {
        model = await tf.loadLayersModel(customFileHandler(modelDir));
        console.log("✅ [TFJS] Tải mô hình thành công. Hệ thống ML Prediction sẵn sàng.");
    } catch (err) {
        console.warn("⚠️ [TFJS] Chưa tìm thấy dữ liệu huấn luyện (model_data). Đang chạy Fallback mode (chưa có trọng số học máy). Hãy chạy `npm run train`.");
        model = null;
    }
}

// Hàm dự đoán rủi ro
function predictRisk(attendance, quizAvg, labAvg, failedSubjects, dependencyImpact) {
    if (!model) {
        // Fallback rule-based risk if ML model isn't loaded
        const baseRisk = failedSubjects * 15 + dependencyImpact * 10;
        return Math.min(Math.max((baseRisk + (100 - attendance) / 2) / 100, 0), 1);
    }
    
    const inputTensor = tf.tensor2d([[
        attendance,
        quizAvg,
        labAvg,
        failedSubjects,
        dependencyImpact
    ]]);
    
    const prediction = model.predict(inputTensor);
    const riskScore = prediction.dataSync()[0]; // Trả về giá trị 0.0 -> 1.0
    
    return riskScore;
}

module.exports = {
    loadModel,
    predictRisk
};
