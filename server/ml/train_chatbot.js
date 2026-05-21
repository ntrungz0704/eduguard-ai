const { NlpManager } = require('node-nlp');
const fs = require('fs');
const path = require('path');

console.log("============================================================");
console.log("🤖 EDUGUARD AI - ADVANCED INTENT CLASSIFIER TRAINING MODULE");
console.log("============================================================");

const manager = new NlpManager({ languages: ['vi', 'en'], forceNER: true, autoSave: false });
const intentsPath = path.join(__dirname, '..', 'data', 'intents.json');

// Load intents from JSON file
if (fs.existsSync(intentsPath)) {
  const intentsData = JSON.parse(fs.readFileSync(intentsPath, 'utf8'));
  
  intentsData.forEach(item => {
    // Add documents (examples) for the intent
    if (item.examples && Array.isArray(item.examples)) {
      item.examples.forEach(example => {
        manager.addDocument('vi', example, item.intent);
      });
    }
    // Add answer if it's a static intent
    if (item.answer) {
      manager.addAnswer('vi', item.intent, item.answer);
    }
  });
  console.log(`✅ Loaded ${intentsData.length} intents from intents.json`);
} else {
  console.error("❌ intents.json not found in server/data!");
}

// ============================================================
// HUẤN LUYỆN VÀ LƯU MODEL
// ============================================================
(async () => {
    console.log("⚙️  Training Intent Classifier Model... Please wait.");
    await manager.train();
    
    const modelPath = path.join(__dirname, 'chatbot_model.nlp');
    manager.save(modelPath);
    
    console.log("🎉 TRAINING COMPLETED SUCESSFULLY!");
    console.log(`📁 Local Chatbot Model saved at: ${modelPath}`);
    console.log("🧠 The EduGuard Intent Pipeline is ready!");
    console.log("============================================================\n");
})();
