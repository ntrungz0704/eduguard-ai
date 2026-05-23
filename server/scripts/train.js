const tf = require("@tensorflow/tfjs");
const fs = require('fs');
const path = require('path');

// Custom IOHandler to save model locally without using @tensorflow/tfjs-node C++ bindings
function customFileHandler(modelDir) {
    return {
        save: async (modelArtifacts) => {
            if (!fs.existsSync(modelDir)) {
                fs.mkdirSync(modelDir, { recursive: true });
            }
            const weightData = modelArtifacts.weightData;
            const weightsManifest = [{
                paths: ['weights.bin'],
                weights: modelArtifacts.weightSpecs
            }];
            const modelTopologyAndWeightManifest = {
                modelTopology: modelArtifacts.modelTopology,
                format: modelArtifacts.format,
                generatedBy: modelArtifacts.generatedBy,
                convertedBy: modelArtifacts.convertedBy,
                weightsManifest
            };
            fs.writeFileSync(path.join(modelDir, 'model.json'), JSON.stringify(modelTopologyAndWeightManifest));
            fs.writeFileSync(path.join(modelDir, 'weights.bin'), Buffer.from(weightData));
            return {
                modelArtifactsInfo: {
                    dateSaved: new Date(),
                    modelTopologyType: 'JSON',
                    modelTopologyBytes: JSON.stringify(modelTopologyAndWeightManifest).length,
                    weightSpecsBytes: JSON.stringify(weightsManifest).length,
                    weightDataBytes: weightData.byteLength,
                }
            };
        }
    };
}

async function runTraining() {
    console.log("🚀 [TRAIN PIPELINE] Bắt đầu huấn luyện mô hình TensorFlow.js...");
    
    // Đọc dataset
    const datasetPath = path.join(__dirname, '../ai_engine/students_dataset.json');
    if (!fs.existsSync(datasetPath)) {
        console.error("❌ Không tìm thấy dataset tại", datasetPath);
        process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    
    // Chuẩn bị features và labels
    const features = [];
    const labels = [];
    
    rawData.forEach(record => {
        features.push([
            record.attendance,
            record.quizAvg,
            record.labAvg,
            record.failedSubjects,
            record.dependencyImpact
        ]);
        labels.push([record.risk]);
    });

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);

    const model = tf.sequential();
    
    model.add(tf.layers.dense({
        inputShape: [5],
        units: 16,
        activation: "relu"
    }));

    model.add(tf.layers.dense({
        units: 8,
        activation: "relu"
    }));

    model.add(tf.layers.dense({
        units: 1,
        activation: "sigmoid"
    }));

    model.compile({
        optimizer: "adam",
        loss: "binaryCrossentropy",
        metrics: ["accuracy"]
    });

    console.log(`🧠 Đang huấn luyện với ${features.length} bản ghi...`);
    
    await model.fit(xs, ys, {
        epochs: 100, // Tăng epoch vì chạy offline không lo chậm server boot
        shuffle: true,
        verbose: 1
    });

    const evalResult = model.evaluate(xs, ys);
    const accuracy = evalResult[1].dataSync()[0];

    console.log(`✅ Huấn luyện hoàn tất! Độ chính xác (Accuracy): ${(accuracy * 100).toFixed(2)}%`);
    
    const modelDir = path.join(__dirname, '../ai_engine/model_data');
    await model.save(customFileHandler(modelDir));
    console.log(`💾 Model đã được lưu thành công tại thư mục: ${modelDir}`);
}

runTraining().then(() => {
    console.log("🏁 Pipeline kết thúc.");
}).catch(err => {
    console.error("❌ Lỗi huấn luyện:", err);
});
