const { NlpManager } = require('node-nlp');
const path = require('path');
const fs = require('fs');

// Khởi tạo NLP Manager
const manager = new NlpManager({ languages: ['vi', 'en'], forceNER: true });

// Đường dẫn lưu file mô hình
const modelPath = path.join(__dirname, '..', 'ai', 'models', 'nlp', 'chatbot_model.nlp');

// ============================================================
// 1. DẠY AI CHO CHẾ ĐỘ GIẢNG VIÊN (TEACHER MODE)
// ============================================================

// --- Intent 1: GREETING & WELCOME ---
const greetings = [
  'hi', 'hello', 'alo', 'chào', 'chào bot', 'xin chào', 'hello eduguard', 'ê bot', 'bot ơi',
  'chào bạn', 'xin chào eduguard', 'hi eduguard', 'lô bot', 'chào buổi sáng', 'chào trợ lý',
  'hello trợ lý học vụ', 'chào dss', 'dss ơi', 'chào robot', 'chào eduguard ai',
  'chào em', 'lô', 'alo alo', 'ad ơi', 'thầy ơi', 'chào buổi chiều', 'chào buổi tối',
  'hey', 'hey bot', 'yo', 'hola', 'good morning', 'good afternoon',
  'chào assistant', 'trợ lý ơi', 'ai ơi', 'eduguard ơi', 'chào nhé',
  'hi bot', 'hello bot', 'bot', 'bot ơi giúp tôi', 'chào bạn nhé',
  'xin chào bot', 'chào trợ lý ai', 'hello assistant'
];
greetings.forEach(text => manager.addDocument('vi', text, 'greeting'));

// --- Intent 2: SYSTEM CAPABILITIES (bạn làm được gì) ---
const capabilities = [
  'bạn làm được gì', 'có gì hay', 'help', 'menu', 'chức năng', 'feature', 'show commands',
  'support gì', 'hỗ trợ gì', 'capabilities', 'hướng dẫn', 'trợ giúp', 'usage',
  'hướng dẫn dùng', 'có thể làm gì', 'bot làm gì', 'commands', 'dùng thế nào',
  'bạn biết gì', 'giúp gì được', 'hướng dẫn sử dụng', 'cách dùng', 'cách sử dụng',
  'tôi có thể hỏi gì', 'hỏi gì được', 'danh sách chức năng', 'list features',
  'bạn có thể giúp gì', 'giúp đỡ', 'tôi cần trợ giúp', 'support', 'guide',
  'bạn có thể làm gì', 'bot biết làm gì', 'tính năng', 'danh sách tính năng',
  'giúp tôi', 'giúp tôi với', 'tôi cần hỗ trợ', 'cho tôi xem menu',
  'instructions', 'how to use', 'what can you do', 'features'
];
capabilities.forEach(text => manager.addDocument('vi', text, 'system.capabilities'));

// --- Intent 3: CLASS ANALYTICS ---
const classAnalytics = [
  'tình hình lớp học', 'phân tích lớp', 'thống kê lớp', 'overview lớp', 'dashboard lớp',
  'phân tích toàn bộ sinh viên', 'tình hình lớp', 'tình hình toàn lớp', 'tình hình chung của lớp',
  'sức khỏe học thuật của lớp', 'thống kê toàn lớp học', 'phân tích toàn lớp', 'overview lớp học',
  'cho tôi xem dashboard lớp', 'thống kê tình trạng lớp học', 'class analytics', 'tổng quan lớp học',
  'tình hình chung lớp này thế nào', 'cho xem thống kê lớp', 'lớp học thế nào rồi',
  'tình hình chung', 'báo cáo lớp', 'report lớp', 'lớp thế nào', 'class report',
  'lớp mình sao rồi', 'thống kê chung', 'overview', 'dashboard', 'tổng quan',
  'phân tích tổng thể lớp học', 'cho xem tình hình', 'xem tổng quan lớp',
  'lớp ra sao', 'tổng quan sinh viên', 'báo cáo tổng thể', 'thống kê sinh viên',
  'xem thống kê', 'xem dashboard', 'tình hình học tập chung', 'bao nhiêu sv risk',
  'thống kê toàn bộ', 'tình hình học tập', 'phân tích tình hình'
];
classAnalytics.forEach(text => manager.addDocument('vi', text, 'query.class_analytics'));

// --- Intent 4: HIGH RISK STUDENTS ---
const highRisk = [
  'top sinh viên nguy cơ', 'ai dễ rớt nhất', 'sv nào nguy hiểm', 'top risk', 'sinh viên đỏ',
  'danh sách sinh viên nguy cơ', 'top sinh viên rủi ro', 'ai sắp rớt', 'đứa nào rủi ro nhất',
  'mấy đứa nguy hiểm nhất', 'đứa nào học tệ nhất', 'sinh viên đỏ nhất', 'danh sách cần cứu gấp',
  'ai nguy cơ cao nhất', 'critical students', 'top sinh viên yếu', 'đứa nào cứu gấp',
  'thằng học yếu nhất', 'đứa học yếu nhất', 'ai học yếu nhất', 'cứu gấp', 'ai dễ tạch nhất',
  'sinh viên nguy hiểm', 'sv đỏ nhất', 'top học lực yếu', 'danh sách đỏ', 'báo động đỏ sinh viên',
  'top sv yếu', 'top 5 sv nguy cơ', 'top 10 sv yếu', 'ai cần can thiệp',
  'sinh viên nào cần cứu', 'ai đang nguy hiểm', 'danh sách cảnh báo',
  'sv yếu nhất', 'em nào rủi ro nhất', 'những ai đang yếu', 'top nguy cơ',
  'xem sinh viên rủi ro', 'sinh viên cần cứu', 'ai rủi ro', 'high risk',
  'danh sách sinh viên yếu', 'sv nào cần can thiệp', 'sinh viên nguy cơ cao',
  'xem danh sách đỏ', 'ai đang critical', 'sv critical', 'sv high risk',
  'ai đang báo động', 'top rủi ro', 'xem top risk', 'top sinh viên nguy cơ cao'
];
highRisk.forEach(text => manager.addDocument('vi', text, 'query.high_risk_students'));

// --- Intent 5: STUDENT ANALYSIS (phân tích sv cụ thể) ---
const studentAnalysis = [
  'phân tích sinh viên đầu tiên', 'đánh giá em đó', 'xem học lực nó', 'sv này sao',
  'đứa đầu tiên học sao', 'phân tích sinh viên này', 'đánh giá sinh viên này', 'đánh giá em này',
  'nó học lực ra sao', 'sv đó học hành thế nào', 'đánh giá em đầu tiên', 'phân tích đứa đầu tiên',
  'phân tích chi tiết kết quả học lực hiện tại của sinh viên này', 'sinh viên này học lực thế nào',
  'đánh giá điểm số của em này', 'xem kết quả học tập', 'sinh viên này có giỏi không', 'gpa hiện tại của nó',
  'học lực em này ra sao', 'điểm số em đó thế nào', 'học lực của sinh viên đầu tiên', 'phân tích đứa thứ hai',
  'sinh viên thứ hai thế nào', 'đánh giá đứa cuối cùng', 'cuối cùng học lực sao',
  'phân tích sv', 'xem sv', 'đánh giá sv', 'risk student', 'em này sao', 'sv đầu tiên',
  'đứa đầu tiên', 'thằng đầu tiên', 'xem hồ sơ', 'hồ sơ sinh viên',
  'check sv', 'xem sinh viên', 'đánh giá học lực', 'phân tích điểm', 'kiểm tra sv',
  'em đó thế nào', 'sinh viên đó sao', 'xem risk', 'xem nguy cơ',
  'phân tích em này', 'đánh giá em đầu', 'phân tích bạn này', 'xem bạn này',
  'sinh viên này thế nào', 'thằng này học sao', 'đứa này học sao',
  'xem điểm sv', 'check điểm', 'xem kết quả', 'xem học lực'
];
studentAnalysis.forEach(text => manager.addDocument('vi', text, 'query.student_analysis'));

// --- Intent 6: ATTENDANCE ANALYSIS ---
const attendance = [
  'xem chuyên cần', 'attendance', 'nó nghỉ học nhiều không', 'vắng bao nhiêu buổi',
  'chuyên cần của nó thế nào', 'tình hình đi học của em đó',
  'vắng chuyên cần', 'điểm danh của nó', 'nó đi học đủ không', 'chuyên cần em này ra sao',
  'sinh viên vắng nhiều không', 'tỉ lệ đi học', 'đi học đầy đủ không', 'vắng bao nhiêu buổi học',
  'attendance của nó thế nào', 'chuyên cần của em đó', 'nó nghỉ học mấy buổi rồi', 'chuyên cần lớp',
  'chuyên cần', 'xem điểm danh', 'vắng mặt', 'nghỉ học', 'đi học', 'nó có đi học không',
  'tỉ lệ vắng', 'tần suất vắng', 'em đó có đi học đều không', 'cc của nó',
  'attendance nó', 'attendance của nó', 'xem attendance', 'kiểm tra chuyên cần',
  'tình hình đi học', 'đi học thế nào', 'vắng nhiều không', 'nghỉ nhiều không',
  'tỉ lệ chuyên cần', 'chuyên cần thế nào', 'đi học đủ chưa', 'vắng mấy buổi',
  'nó nghỉ nhiều không', 'có đi học đều không', 'xem vắng', 'cc em đó'
];
attendance.forEach(text => manager.addDocument('vi', text, 'query.attendance'));

// --- Intent 7: INTERVENTION PLAN ---
const intervention = [
  'lộ trình can thiệp', 'cứu sinh viên này', 'gửi cảnh báo', 'nên làm gì', 'phụ đạo sao',
  'lộ trình can thiệp học tập và kế hoạch ôn tập', 'làm sao để sinh viên này cải thiện điểm số',
  'gợi ý giải pháp phụ đạo', 'lộ trình giúp em này qua môn', 'có lời khuyên nào cho sinh viên này không',
  'gợi ý cải thiện', 'lộ trình học', 'cần học gì', 'cách cứu sinh viên này', 'đề xuất can thiệp',
  'lộ trình cứu sinh viên', 'can thiệp cho nó', 'cứu đứa này', 'đề xuất phụ đạo cho nó',
  'kế hoạch cứu sinh viên đỏ', 'cải thiện kết quả học tập thế nào',
  'can thiệp', 'cứu sv', 'phụ đạo', 'roadmap học', 'kế hoạch học tập',
  'gợi ý can thiệp', 'giải pháp', 'khắc phục', 'hỗ trợ em này', 'làm sao cứu',
  'đề xuất hỗ trợ', 'kế hoạch phụ đạo', 'plan can thiệp', 'intervention',
  'gợi ý phụ đạo', 'cần can thiệp gì', 'giải pháp cho sv này', 'cứu em này'
];
intervention.forEach(text => manager.addDocument('vi', text, 'query.intervention'));

// --- Intent 8: MESSAGE GENERATION ---
const genMessage = [
  'soạn tin nhắn', 'viết tin zalo', 'gửi cảnh báo nhẹ nhàng', 'soạn tin nhắn cảnh báo',
  'viết tin nhắn nhắc nhở', 'soạn email cảnh báo', 'soạn thư gửi sinh viên', 'soạn tin nhắn zalo cứu sinh viên',
  'viết tin nhắn can thiệp', 'soạn tin can thiệp', 'mẫu tin nhắn gửi nó', 'soạn tin gửi em này',
  'viết mail phụ đạo', 'soạn thư cảnh báo chuyên cần', 'mẫu tin nhắn zalo', 'soạn tin nhắn nhắc vắng',
  'gửi mail', 'soạn zalo', 'gửi tin nhắn', 'viết email', 'soạn mail',
  'gửi cảnh báo cho nó', 'soạn tin cảnh báo', 'viết thư nhắc nhở', 'draft message',
  'soạn tin nhắn cho sinh viên', 'mẫu email', 'template tin nhắn'
];
genMessage.forEach(text => manager.addDocument('vi', text, 'query.generate_message'));

// --- Intent 9: BOTTLENECK SUBJECTS ---
const bottleneck = [
  'môn dễ rớt', 'môn bottleneck', 'môn nào fail nhiều', 'môn nguy hiểm nhất',
  'môn nào dễ trượt nhất hệ thống', 'môn nào dễ trượt nhất', 'môn nào kéo gpa cả lớp',
  'môn tiên quyết nào gây fail dây chuyền nhiều nhất', 'môn khó nhất', 'môn fail nhiều',
  'môn tiên quyết nguy hiểm', 'môn dễ fail', 'môn nào dễ trượt',
  'môn nhiều người fail', 'môn khó qua', 'môn tạch nhiều nhất', 'môn nào tạch nhiều nhất',
  'nút thắt cổ chai môn học', 'môn tạch nhiều', 'môn rớt nhiều', 'môn khó', 'tỉ lệ rớt môn',
  'môn dễ tạch nhất hệ thống', 'môn học nguy hiểm', 'môn học rớt nhiều nhất', 'nút thắt cổ chai',
  'bottleneck', 'môn nguy hiểm', 'subject fail', 'môn nào nhiều sv tạch',
  'môn nhiều sinh viên rớt', 'môn nào dễ rớt nhất', 'top môn khó',
  'danh sách môn nguy hiểm', 'môn nào nguy cơ cao', 'môn fail rate cao',
  'tỉ lệ trượt cao nhất', 'môn kéo gpa', 'môn gây rớt dây chuyền'
];
bottleneck.forEach(text => manager.addDocument('vi', text, 'query.bottleneck'));

// --- Intent 10: SYLLABUS & CURRICULUM ---
const syllabus = [
  'syllabus web206', 'môn tiên quyết là gì', 'ltw học gì', 'fpt có bao nhiêu môn',
  'đề cương môn học', 'nội dung môn học này là gì', 'đề cương chi tiết môn này',
  'cho xem đề cương môn', 'môn này học những gì', 'syllabus môn', 'nội dung môn',
  'chương trình đào tạo gồm những môn gì', 'syllabus com108', 'syllabus web104',
  'môn tiên quyết của môn này là gì', 'tiên quyết của môn', 'com108 học gì',
  'tiên quyết của web206', 'syllabus pro101', 'đề cương môn lập trình java',
  'syllabus php1', 'đề cương php1', 'môn này học gì', 'tiên quyết là gì',
  'học trước môn nào', 'xem đề cương', 'nội dung khóa học', 'đề cương',
  'syllabus', 'xem syllabus', 'tra cứu môn học', 'thông tin môn',
  'chi tiết môn học', 'xem nội dung môn', 'đề cương chi tiết'
];
syllabus.forEach(text => manager.addDocument('vi', text, 'query.syllabus'));

// --- Intent 11: PREREQUISITE GRAPH CHAIN ---
const prereqChain = [
  'chuỗi môn học', 'môn chặn', 'dependency chain', 'nợ môn nào kéo theo gì',
  'chuỗi môn tiên quyết', 'sơ đồ tiên quyết', 'bản đồ chuỗi môn học', 'chuỗi môn học ảnh hưởng',
  'dependency graph môn học', 'chuỗi tiên quyết', 'nợ môn này ảnh hưởng môn nào',
  'môn chặn dây chuyền', 'chuỗi môn học kéo theo', 'môn nào chặn môn nào',
  'risk chain', 'xem risk chain', 'chuỗi rủi ro', 'graph môn học',
  'sơ đồ phụ thuộc', 'dependency graph', 'chuỗi phụ thuộc',
  'rớt môn này ảnh hưởng gì', 'ảnh hưởng dây chuyền', 'domino effect'
];
prereqChain.forEach(text => manager.addDocument('vi', text, 'query.prerequisite_chain'));

// --- Intent 12: RISK EXPLAINABILITY (XAI) ---
const riskExplain = [
  'vì sao risk cao', 'giải thích risk', 'tại sao nó đỏ', 'tại sao sinh viên này rủi ro',
  'giải thích nguyên nhân rủi ro', 'vì sao nguy cơ cao', 'tại sao risk score 92',
  'nguyên nhân cốt lõi của rủi ro', 'giải thích tại sao nó rủi ro', 'tại sao nó bị đỏ',
  'lý do rủi ro là gì', 'giải thích chỉ số risk', 'tại sao điểm rủi ro cao',
  'nguyên nhân rủi ro dây chuyền', 'giải thích vì sao nó sắp rớt', 'vì sao nó đỏ',
  'nguyên nhân', 'nguyên nhân cốt lõi', 'tại sao rủi ro', 'xai', 'explainable',
  'giải thích nguyên nhân', 'vì sao', 'tại sao', 'lý do', 'root cause',
  'phân tích nguyên nhân', 'giải thích chi tiết', 'vì sao nó yếu', 'tại sao điểm thấp'
];
riskExplain.forEach(text => manager.addDocument('vi', text, 'query.xai'));

// --- Intent 13: OUT OF SCOPE DETECTION ---
const outOfScope = [
  'hôm nay thời tiết sao', 'mở youtube đi', 'bạn ăn cơm chưa', 'thời tiết tuần này',
  'hướng dẫn nấu ăn', 'dịch hộ tôi đoạn này', 'giá vàng hôm nay', 'tình hình covid',
  'tin tức hôm nay', 'mở nhạc trẻ', 'mua đồ ở đâu', 'hát một bài đi', 'kể chuyện hài đi',
  'bóng đá hôm nay', 'tỉ giá đô la', 'thời sự', 'xem phim gì hay', 'chỉ đường đi',
  'đặt pizza', 'gọi taxi', 'tra cứu số điện thoại', 'mấy giờ rồi', 'ngày mai thứ mấy'
];
outOfScope.forEach(text => manager.addDocument('vi', text, 'query.out_of_scope'));

// --- Intent 14: EXCEL IMPORT STATUS ---
const importStatus = [
  'file import lỗi gì', 'bao nhiêu dòng fail', 'trạng thái import', 'kết quả import file',
  'lịch sử import', 'import excel thành công bao nhiêu', 'dòng nào bị lỗi import',
  'lỗi file import excel', 'kết quả nạp dữ liệu', 'import dữ liệu thế nào rồi',
  'file vừa tải lên lỗi gì không', 'import excel status',
  'import status', 'trạng thái nạp dữ liệu', 'upload thế nào rồi', 'kết quả upload'
];
importStatus.forEach(text => manager.addDocument('vi', text, 'query.import_status'));

// --- Intent 15: GPA SIMULATION ---
const gpaSimulation = [
  'nếu final 8 thì sao', 'cần bao nhiêu điểm để qua', 'nếu tôi được 8 final thì gpa bao nhiêu',
  'tính thử điểm gpa', 'mục tiêu điểm số', 'nếu thi được 9 điểm final', 'nếu điểm asm được 8',
  'cần bao nhiêu final để qua môn', 'nếu final được 5', 'nếu điểm cuối kỳ được 10',
  'gpa dự báo nếu final 7', 'simulate gpa', 'giả lập điểm', 'tính gpa',
  'nếu đạt điểm', 'dự đoán gpa', 'gpa simulation', 'cần bao nhiêu điểm'
];
gpaSimulation.forEach(text => manager.addDocument('vi', text, 'query.gpa_simulation'));

// --- Intent 16: GENERAL SYSTEM INFO ---
const systemInfo = [
  'giới thiệu về hệ thống', 'kiến trúc hệ thống là gì',
  'công thức pearson', 'chi tiết công thức', 'hệ thống hoạt động thế nào',
  'explainable ai', 'kiến trúc DSS', 'hệ thống dùng thuật toán gì',
  'ai engine hoạt động sao', 'mô hình dss là gì', 'giới thiệu eduguard',
  'thuật toán nào', 'mô hình ai', 'kiến trúc', 'system architecture',
  'technology stack', 'công nghệ sử dụng'
];
systemInfo.forEach(text => manager.addDocument('vi', text, 'query.system_info'));

// --- Intent 17: PREREQUISITE EXPLANATION ---
const prereqExplain = [
  'mô hình tiên quyết hoạt động sao', 'dependency chain là gì', 'dfs bfs là gì',
  'giải thích thuật toán tìm chuỗi tiên quyết', 'thuật toán duyệt đồ thị tiên quyết',
  'mô hình phân tích chuỗi môn học tiên quyết hoạt động như thế nào',
  'giải thích dependency chain', 'dfs và bfs hoạt động ra sao trên đồ thị môn học',
  'mô hình chuỗi tiên quyết hoạt động thế nào', 'giải thích thuật toán tiên quyết',
  'thuật toán prerequisite', 'prerequisite model', 'graph algorithm'
];
prereqExplain.forEach(text => manager.addDocument('vi', text, 'query.prerequisite_explanation'));

// --- Intent 18: STUDENT PREDICTION ---
const studentPred = [
  'dự đoán ps47261', 'risk của ps47261', 'dự báo gpa cho pc12345', 'chạy dss cho ps47261',
  'dự đoán bạn ps47261', 'dự đoán kết quả học tập ps47261', 'dự đoán điểm số ps47261',
  'dự báo nguy cơ cho ps47261', 'dự báo rớt môn ps47261', 'chạy dự đoán cho ps47261',
  'dự đoán', 'dự báo', 'predict', 'chạy dss', 'dự đoán sinh viên', 'dự báo sinh viên'
];
studentPred.forEach(text => manager.addDocument('vi', text, 'query.student_prediction'));

// --- Intent 19: CURRICULUM INFO ---
const curriculumInfo = [
  'có bao nhiêu môn', 'tổng số môn', 'chương trình học gồm bao nhiêu môn', 'fpt có bao nhiêu môn',
  'tổng số học phần', 'chương trình đào tạo có bao nhiêu môn', 'lộ trình học có bao nhiêu môn',
  'có bn môn', 'tổng số môn học', 'chương trình đào tạo fpt polytechnic gồm bao nhiêu môn',
  'bao nhiêu môn', 'tổng cộng bao nhiêu môn', 'chương trình đào tạo', 'lộ trình đào tạo',
  'chương trình đào tạo fpt', 'fpt poly có bao nhiêu môn', 'tổng quan chương trình đào tạo'
];
curriculumInfo.forEach(text => manager.addDocument('vi', text, 'query.curriculum_info'));

// --- Intent 20: FOLLOWUP STUDENT (đại từ "nó", "em đó") ---
const followupStudent = [
  'đứa đầu tiên thì sao', 'attendance nó', 'nó học sao', 'chuyên cần của nó thế nào',
  'nó có ổn không', 'học lực em đầu tiên', 'phân tích em đó', 'đứa thứ hai thì sao',
  'kết quả của nó', 'chuyên cần của em đó',
  'nó thì sao', 'còn em đó', 'risk chain của nó', 'môn yếu của nó',
  'em đó sao', 'thằng này sao', 'đứa này sao', 'bạn đó sao',
  'gửi mail cho nó', 'can thiệp cho nó', 'cứu nó', 'xem nó',
  'đứa đó thế nào', 'em này ra sao', 'bạn này thế nào'
];
followupStudent.forEach(text => manager.addDocument('vi', text, 'query.followup_student'));

// --- Intent 21: SUBJECT ANALYSIS ---
const subjectAnalysis = [
  'phân tích môn php1', 'môn js sao', 'môn com108 thế nào', 'tình hình môn web206',
  'phân tích học phần pro101', 'môn lập trình java thế nào', 'tỉ lệ tạch môn php1',
  'môn dự án 1 ra sao', 'phân tích tình trạng môn web104',
  'phân tích môn', 'tình hình môn', 'môn này sao', 'xem môn',
  'môn đó thế nào', 'tỉ lệ rớt môn này', 'fail rate môn'
];
subjectAnalysis.forEach(text => manager.addDocument('vi', text, 'query.subject_analysis'));


// ============================================================
// 2. DẠY AI CHO CHẾ ĐỘ SINH VIÊN (STUDENT MODE)
// ============================================================

// STUDENT_OVERVIEW_INTENT
const studentOverview = [
  'tình hình học tập của tôi sao rồi', 'tôi đang ổn không', 'học lực hiện tại thế nào',
  'xem kết quả của tôi', 'điểm trung bình của tôi', 'tôi học thế nào', 'kết quả của tôi',
  'gpa của tôi', 'điểm của tôi', 'tổng quan học tập', 'overview của tôi',
  'tình hình của tôi', 'tôi đang sao', 'xem điểm'
];
studentOverview.forEach(text => manager.addDocument('vi', text, 'student.overview'));

// STUDENT_RISK_INTENT
const studentRisk = [
  'tôi dễ rớt môn nào', 'môn nào nguy hiểm nhất', 'tôi sắp tạch môn nào',
  'có khả năng rớt môn không', 'tôi có nguy cơ không', 'môn nào tôi yếu nhất',
  'tôi đang nguy hiểm không', 'risk của tôi', 'rủi ro của tôi'
];
studentRisk.forEach(text => manager.addDocument('vi', text, 'student.risk'));

// STUDENT_RECOMMENDATION_INTENT
const studentRec = [
  'làm sao cải thiện gpa', 'gợi ý học tập', 'tôi nên học gì tuần này',
  'cách kéo điểm', 'lên kế hoạch học tập', 'nên ôn gì', 'học gì trước',
  'lời khuyên học tập', 'gợi ý ôn thi', 'cải thiện điểm số'
];
studentRec.forEach(text => manager.addDocument('vi', text, 'student.recommendation'));

// STUDENT_MOTIVATION_INTENT
const studentMotivation = [
  'tôi còn cứu được không', 'tôi học ngu quá', 'tôi stress', 'thấy nản quá',
  'có hy vọng gì không', 'tôi chán học', 'tôi muốn bỏ học', 'tôi buồn quá',
  'tôi thất vọng', 'tôi lo lắng', 'áp lực quá'
];
studentMotivation.forEach(text => manager.addDocument('vi', text, 'student.motivation'));

// STUDENT_GPA_SIMULATION_INTENT
const studentGpa = [
  'nếu tôi được 8 final thì gpa bao nhiêu', 'tôi cần bao nhiêu điểm để qua môn',
  'tính thử điểm gpa', 'mục tiêu điểm số', 'nếu final 8 thì sao',
  'gpa dự kiến', 'tôi cần bao nhiêu điểm'
];
studentGpa.forEach(text => manager.addDocument('vi', text, 'student.gpa_simulation'));

// STUDENT_PROGRESS_INTENT
const studentProgress = [
  'tôi có tiến bộ không', 'so với tuần trước thì sao', 'thống kê tuần này',
  'tiến bộ', 'so sánh tuần trước', 'xu hướng học tập'
];
studentProgress.forEach(text => manager.addDocument('vi', text, 'student.progress'));

// STUDENT_SYLLABUS_INTENT
const studentSyllabus = [
  'môn này tôi sẽ học gì', 'nội dung khóa học', 'đề cương của môn',
  'tôi học gì', 'nội dung môn tôi đang học'
];
studentSyllabus.forEach(text => manager.addDocument('vi', text, 'student.syllabus'));


// ============================================================
// 3. Huấn luyện (Training Execution)
// ============================================================
(async () => {
  console.log("🚀 Đang tiến hành huấn luyện (Training) Mô hình NLP...");
  console.log(`📊 Tổng số intent groups: 28+`);
  await manager.train();
  
  // Lưu mô hình
  const mlDir = path.join(__dirname, '..', 'ai', 'models', 'nlp');
  if (!fs.existsSync(mlDir)) {
    fs.mkdirSync(mlDir, { recursive: true });
  }
  
  manager.save(modelPath);
  console.log(`✅ Huấn luyện thành công! Mô hình đã được lưu tại: ${modelPath}`);
})();
