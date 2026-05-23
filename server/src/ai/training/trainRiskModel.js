const tf = require("@tensorflow/tfjs");

// Fake Dataset [attendance, quizAvg, failedSubjects, gpa]
const xs = tf.tensor2d([
  [95, 8.5, 0, 8.1],
  [60, 4.2, 3, 5.5],
  [75, 6.1, 1, 6.8],
  [50, 3.5, 4, 4.5],
  [88, 7.5, 0, 7.6],
  [65, 5.0, 2, 5.8],
  [40, 2.5, 5, 3.2],
  [98, 9.0, 0, 8.9],
  [82, 6.5, 1, 6.4],
  [70, 5.5, 2, 5.9]
]);

// Labels (1 = High Risk, 0 = Safe)
const ys = tf.tensor2d([
  [0],
  [1],
  [0],
  [1],
  [0],
  [1],
  [1],
  [0],
  [0],
  [1]
]);

// Define Model
const model = tf.sequential();

model.add(tf.layers.dense({
  inputShape: [4],
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

async function train() {
  console.log("🚀 Bắt đầu huấn luyện mô hình TensorFlow.js...");
  
  await model.fit(xs, ys, {
    epochs: 150,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 50 === 0) {
          console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
        }
      }
    }
  });

  // await model.save("file://./risk_model");
  // console.log("✅ Đã lưu mô hình tại thư mục ./risk_model");
  
  // Test predict
  console.log("🧪 Đang thử nghiệm dự đoán (Test predict)...");
  
  // Test case: attendance 65, quiz 5.2, failed 2, gpa 5.5 => should be high risk
  const testData = tf.tensor2d([[65, 5.2, 2, 5.5]]);
  const prediction = model.predict(testData);
  const result = prediction.dataSync()[0];
  
  console.log(`🎯 Risk Prediction: ${result.toFixed(2)}`);
  console.log(`=> Sinh viên này có nguy cơ học vụ: ${(result * 100).toFixed(1)}%`);
}

train();
