const predictionService = require('./service');
const cache = require('../../shared/cache');
const multer = require('multer');
const XLSX = require('xlsx');

// Initialize Multer
const upload = multer({ storage: multer.memoryStorage() });

class PredictionController {
  
  /**
   * Endpoint: /api/v1/prediction/:subject
   * Handles predicting a specific subject for uploaded students
   */
  async predictSubject(req, res, next) {
    try {
      const subject = req.params.subject;
      if (!cache.trainingData.subjects || cache.trainingData.subjects.length === 0) {
        return res.status(400).json({ error: 'Chưa có dữ liệu huấn luyện. Vui lòng Huấn luyện mô hình trước.' });
      }

      if (!cache.trainingData.subjects.includes(subject)) {
        return res.status(400).json({ error: `Môn học '${subject}' không có trong chương trình đào tạo.` });
      }

      if (cache.uploadedStudents.length === 0) {
        return res.status(400).json({ error: 'Chưa có danh sách sinh viên. Vui lòng upload bảng điểm trước.' });
      }

      const cachedModel = cache.modelCache[subject];

      const result = await predictionService.predictScores(
        subject,
        cache.uploadedStudents,
        cache.trainingData,
        cachedModel
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // Define upload configuration as a property
  get uploadMiddleware() {
    return upload.any();
  }
}

module.exports = new PredictionController();
