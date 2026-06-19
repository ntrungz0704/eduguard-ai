process.env.TF_CPP_MIN_LOG_LEVEL = '3';
const tf = require("@tensorflow/tfjs");
const fs = require("fs");
const path = require("path");

// 1. Prepare data from Enhanced CSV
function prepareData() {
  const csvPath = path.join(__dirname, "enhanced_student_grades.csv");
  const raw = fs.readFileSync(csvPath, "utf8");
  const lines = raw.trim().split("\n");
  
  const xsData = [];
  const ysData = [];
  
  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // cols structure: [MSSV, ...grades..., attendance_rate, assignment_avg, quiz_avg, late_submission, missed_deadlines]
    const cols = line.split(",");
    
    let totalSubjects = 0;
    let failedSubjects = 0;
    let sumGrades = 0;
    
    // The last 5 columns are the behavioral features
    const attendance_rate = parseFloat(cols[cols.length - 5]);
    const assignment_avg = parseFloat(cols[cols.length - 4]);
    const quiz_avg = parseFloat(cols[cols.length - 3]);
    const late_submission = parseFloat(cols[cols.length - 2]);
    const missed_deadlines = parseFloat(cols[cols.length - 1]);
    
    // Parse grades from column 1 to length - 6
    for (let j = 1; j < cols.length - 5; j++) {
      const val = cols[j].trim();
      if (val !== "" && val !== "*" && val !== "-") {
        const grade = parseFloat(val);
        if (!isNaN(grade)) {
          totalSubjects++;
          sumGrades += grade;
          if (grade < 5.0) {
            failedSubjects++;
          }
        }
      }
    }
    
    if (totalSubjects > 0) {
      const gpa = sumGrades / totalSubjects;
      const failRate = failedSubjects / totalSubjects;
      
      // Complex Risk Labeling (Rule-based Risk Engine)
      // Combining academic performance with behavioral indicators
      let riskScore = 0;
      
      // Academic factors
      if (gpa < 5.0) riskScore += 40;
      else if (gpa < 6.0) riskScore += 20;
      
      if (failRate > 0.3) riskScore += 30;
      else if (failRate > 0.15) riskScore += 15;
      
      // Behavioral factors
      if (attendance_rate < 0.6) riskScore += 20;
      else if (attendance_rate < 0.8) riskScore += 10;
      
      if (missed_deadlines >= 3) riskScore += 15;
      if (late_submission >= 5) riskScore += 10;
      
      // Label = 1 (High Risk) if Risk Score >= 50
      const label = riskScore >= 50 ? 1 : 0;
      
      // Feature array: [gpa, failRate, attendance_rate, assignment_avg, quiz_avg, late_submission, missed_deadlines]
      xsData.push([gpa, failRate, attendance_rate, assignment_avg, quiz_avg, late_submission, missed_deadlines]);
      ysData.push([label]);
    }
  }
  return { xsData, ysData };
}

console.log("📊 Đang đọc và xử lý dữ liệu hành vi (Enhanced Data) từ file CSV...");
const { xsData, ysData } = prepareData();
console.log(`✅ Đã nạp thành công ${xsData.length} mẫu dữ liệu sinh viên với 7 Features.`);

const xs = tf.tensor2d(xsData);
const ys = tf.tensor2d(ysData);

// 2. Define Model Architecture (Prototype Prediction Model)
const model = tf.sequential();

model.add(tf.layers.dense({
  inputShape: [7], // Cập nhật input shape = 7 features
  units: 16,
  activation: "relu"
}));

model.add(tf.layers.dense({
  units: 8,
  activation: "relu"
}));

model.add(tf.layers.dense({
  units: 1,
  activation: "sigmoid" // Predict probability of Risk (0.0 to 1.0)
}));

model.compile({
  optimizer: "adam",
  loss: "binaryCrossentropy",
  metrics: ["accuracy"]
});

async function train() {
  console.log("🚀 Bắt đầu huấn luyện Prototype AI Model...");
  
  await model.fit(xs, ys, {
    epochs: 200,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 50 === 0) {
          console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
        }
      }
    }
  });

  // Xuất file parameter model ra thư mục risk_model bằng custom handler
  const exportDir = path.join(__dirname, "risk_model");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  await model.save(tf.io.withSaveHandler(async (artifacts) => {
    fs.writeFileSync(path.join(exportDir, "model.json"), JSON.stringify({
      modelTopology: artifacts.modelTopology,
      weightsManifest: [{
        paths: ["weights.bin"],
        weights: artifacts.weightSpecs
      }]
    }));
    fs.writeFileSync(path.join(exportDir, "weights.bin"), Buffer.from(artifacts.weightData));
    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: "JSON" } };
  }));
  console.log("✅ Đã xuất và lưu mô hình tại thư mục: " + exportDir);
  
  // Test predict với 1 trường hợp giả định
  console.log("🧪 Đang thử nghiệm dự đoán (Test predict)...");
  
  // Test: GPA=4.5, failRate=0.4, attendance=0.5, assign=4.0, quiz=5.0, late=5, missed=2
  const testData = tf.tensor2d([[4.5, 0.4, 0.5, 4.0, 5.0, 5, 2]]);
  const prediction = model.predict(testData);
  const result = prediction.dataSync()[0];
  
  console.log(`🎯 AI Prediction Score: ${result.toFixed(2)}`);
  console.log(`=> Khả năng rớt môn / cảnh báo học vụ của SV này: ${(result * 100).toFixed(1)}%`);

  // Cleanup to prevent memory leaks
  testData.dispose();
  prediction.dispose();
  tf.disposeVariables();
}

train();
