# 🏆 BÁO CÁO TỔNG KẾT DỰ ÁN EDUGUARD AI 
**Hệ thống Hỗ trợ Ra Quyết định Học vụ Sớm (Educational Early Warning DSS Platform)**

---

## 1. TỔNG QUAN DỰ ÁN
**EduGuard AI** được phát triển nhằm giải quyết bài toán cốt lõi trong giáo dục đại học: Phát hiện sớm sinh viên có nguy cơ rớt môn/bỏ học và hỗ trợ cố vấn học tập ra quyết định can thiệp kịp thời. 

Thay vì xây dựng một chatbot "thần thánh" phi thực tế, EduGuard định vị mình là một **Hybrid Explainable Educational DSS** (Hệ thống Hỗ trợ Ra quyết định lai có khả năng giải thích).

---

## 2. KIẾN TRÚC HỆ THỐNG ĐÃ HOÀN THIỆN

Dự án đã áp dụng thành công kiến trúc 4 tầng chuẩn Enterprise:

### 🔹 Tầng 1: NLP Chat Assistant (Giao tiếp tự nhiên)
- **Công nghệ:** `node-nlp` (chạy hoàn toàn local, bảo mật dữ liệu sinh viên).
- **Tính năng:** Phân loại ý định (Intent Classification), nhận diện thực thể (Entity Extraction), và hiểu từ đồng nghĩa (Fuzzy Matching/Synonyms). Hệ thống có thể phân biệt rõ ràng các intent như "tình hình lớp", "top rủi ro", "môn dễ rớt" (bottleneck).
- **Trạng thái:** Đã huấn luyện (Trained) và hoạt động ổn định.

### 🔹 Tầng 2: Session Memory (Quản lý ngữ cảnh)
- **Công nghệ:** In-memory store kết hợp logic Context Resolver.
- **Tính năng:** Nhớ ngữ cảnh cuộc trò chuyện. Khi người dùng hỏi *"phân tích PS47261"* rồi hỏi tiếp *"chuyên cần sao rồi?"*, AI vẫn hiểu đang nói về sinh viên PS47261.
- **Trạng thái:** Hoạt động trơn tru.

### 🔹 Tầng 3: DSS Engine & Dependency Graph (Logic học vụ)
- **Công nghệ:** Rule-based Engine kết hợp Simple Adjacency List.
- **Tính năng:** 
  - Tính toán điểm số rủi ro (Risk Score) dựa trên Chuyên cần, Điểm quá trình, và Lịch sử học tập.
  - Theo dõi Chuỗi môn tiên quyết (Dependency Chain). Ví dụ: Rớt JS -> Rủi ro cao ở PHP1 -> Nguy cơ đứt Dự án 1.
- **Trạng thái:** Cốt lõi vững chắc, đã có bộ dữ liệu môn học phụ thuộc.

### 🔹 Tầng 4: XAI & Confidence Calibration (Giải thích & Hiệu chỉnh)
- **Công nghệ:** AI Formatter & ML Calibration.
- **Tính năng:**
  - **Explainable AI (XAI):** Phân rã nguyên nhân gốc rễ (Root Cause) để giải thích tại sao sinh viên lại ở mức rủi ro cao (VD: 40% do chuyên cần, 35% do nợ môn nền tảng).
  - **Confidence Calibration:** Chuyển đổi xác suất rủi ro thô thành Mức độ tin cậy (Confidence: High/Medium/Low) giúp tránh hiện tượng AI overconfidence.
- **Trạng thái:** Vừa hoàn thiện và nâng cấp thành công.

---

## 3. CÁC TÍNH NĂNG VÀ LỖI ĐÃ KHẮC PHỤC (BUG FIXES)

1. **Khắc phục lỗi Rate Limit API:** Tăng giới hạn request để tránh lỗi `429 Too Many Requests` che khuất các lỗi hệ thống thật.
2. **Xử lý triệt để lỗi Crash Frontend (t.map is not a function):**
   - Backend: Chuẩn hóa lại format biểu đồ từ Object (`Chart.js`) sang Array (`Recharts`) trong `chartBuilder.js`.
   - Frontend: Thêm các kỹ thuật phòng thủ (Defensive Programming) bằng `Array.isArray()` để chặn đứng hiện tượng "bóng ma" từ `localStorage` làm sập giao diện.
3. **Nâng cấp môi trường CI/CD (GitHub Actions):** Cập nhật Node.js lên v22 để hỗ trợ phiên bản Prisma 7.x mới nhất, giúp pipeline tự động build xanh mướt.
4. **Nâng cấp NLP:** Thêm hàng loạt utterances cho tính năng Bottleneck (Môn kéo gpa, môn dễ rớt, môn tiên quyết nguy hiểm) và retrain lại mô hình.

---

## 4. BỘ TÀI LIỆU (DOCS) ĐÃ HOÀN THIỆN CHO CUỘC THI SMARTGEN
Toàn bộ tài liệu pitching đã được chuẩn bị sẵn sàng trong thư mục `/docs`:
- `PitchDeck_EduGuardAI.md`: Nội dung slide (Hero Opening, Pain Point, Solution, Architecture, Timeline).
- `BaoCao_EduGuardAI.md`: Bản báo cáo hàn lâm để nộp cho BGK.
- `Presentation_Script.md`: Kịch bản nói chi tiết từng phút cho người thuyết trình.
- `Architecture.md`: Sơ đồ kiến trúc hệ thống chuyên sâu.

---

## 5. HƯỚNG PHÁT TRIỂN TIẾP THEO (NEXT STEPS) ĐỂ LÊN LEVEL ENTERPRISE
Nếu muốn tiến xa hơn (Phase 2 & 3), nhóm có thể bổ sung:
1. **Machine Learning thật (Python + XGBoost):** Triển khai microservice Python chạy mô hình Random Forest/XGBoost để predict thay vì dùng TFJS/Rule-based.
2. **Intervention Feedback Loop:** CVHT báo cáo "đã can thiệp thành công", hệ thống ghi nhận và tự động retrain mô hình.
3. **Neo4j Academic Knowledge Graph:** Nâng cấp danh sách môn học kề thành một Graph Database thực thụ để query mối quan hệ phức tạp hơn.

---
**Chữ ký hệ thống:** *Hệ thống đã đạt mức độ ổn định cao nhất (Stable) cho phiên bản Demo Vòng sơ loại cuộc thi SmartGen 2026.*
