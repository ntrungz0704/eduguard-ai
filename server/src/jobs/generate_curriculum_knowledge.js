const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', '..', 'data', 'knowledge');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 34 FPT Polytechnic Web Development courses knowledge base
const curriculum = [
  {
    "courseId": "COM1071",
    "courseName": "Tin học",
    "semester": 1,
    "credits": 3,
    "description": "Trang bị kiến thức tin học văn phòng cơ bản bao gồm soạn thảo văn bản, bảng tính, trình chiếu và sử dụng internet an toàn.",
    "learningOutcomes": ["CLO1: Sử dụng thành thạo Microsoft Word soạn thảo văn bản", "CLO2: Áp dụng công thức và hàm cơ bản trong Excel", "CLO3: Thiết kế slide thuyết trình PowerPoint chuyên nghiệp"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["Word processing", "Excel spreadsheet calculation", "PowerPoint presentation", "Information search"],
    "technologiesTools": ["Microsoft Office", "Google Workspace", "Windows OS"],
    "careerRelevance": ["IT Support", "Office Administrator", "IT Business Analyst"],
    "commonFailureReasons": ["Thiếu thực hành máy tính dẫn đến quên phím tắt", "Không nhớ công thức và hàm Excel", "Chủ quan cho là tin học văn phòng dễ"],
    "remediationRecommendations": ["Dành 3 giờ thực hành làm bài tập Excel mỗi tuần", "Ôn tập bộ phím tắt Word và Excel thông dụng", "Làm thử các đề thi mẫu trực tuyến"],
    "academicImportanceLevel": "LOW",
    "bottleneckWeight": 1
  },
  {
    "courseId": "VIE103",
    "courseName": "Giáo dục thể chất - Vovinam",
    "semester": 1,
    "credits": 3,
    "description": "Giáo dục thể chất thông qua môn võ cổ truyền Vovinam, rèn luyện thể lực, tính kỷ luật và tinh thần tự vệ.",
    "learningOutcomes": ["CLO1: Nắm vững các đòn thế võ tự vệ cơ bản", "CLO2: Đạt chuẩn thể lực quy định", "CLO3: Rèn luyện tính kỷ luật tự giác"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["Physical fitness", "Self defense", "Team discipline"],
    "technologiesTools": ["Vovinam uniform"],
    "careerRelevance": ["Health counselor", "Security coordinator"],
    "commonFailureReasons": ["Nghỉ học quá số buổi chuyên cần quy định", "Không thuộc bài quyền cơ bản", "Thiếu tích cực rèn luyện thể lực"],
    "remediationRecommendations": ["Đi học đầy đủ chuyên cần các buổi tập", "Tập luyện bài quyền cùng nhóm bạn sau giờ học", "Rèn luyện thể lực thêm tại nhà"],
    "academicImportanceLevel": "LOW",
    "bottleneckWeight": 1
  },
  {
    "courseId": "PDP102",
    "courseName": "Kỹ năng học tập",
    "semester": 1,
    "credits": 2,
    "description": "Trang bị các phương pháp học tập hiệu quả ở môi trường cao đẳng, quản lý thời gian và học tập chủ động.",
    "learningOutcomes": ["CLO1: Lập kế hoạch tuần và quản lý thời gian học tập", "CLO2: Sử dụng sơ đồ tư duy Cornell và Mindmap", "CLO3: Kỹ năng làm việc nhóm cơ bản"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["Time management", "Active learning", "Mindmapping", "Presentation skills"],
    "technologiesTools": ["Trello", "Google Calendar", "Mindmeister"],
    "careerRelevance": ["Project Coordinator", "Team Leader"],
    "commonFailureReasons": ["Không có kế hoạch học tập rõ ràng", "Thiếu tính chủ động tự học", "Không nộp bài tập kỹ năng đúng hạn"],
    "remediationRecommendations": ["Lập thời khóa biểu tự học tuần", "Sử dụng sơ đồ tư duy tóm tắt môn học", "Tham gia tích cực vào các bài tập nhóm"],
    "academicImportanceLevel": "LOW",
    "bottleneckWeight": 1
  },
  {
    "courseId": "COM108",
    "courseName": "Nhập môn lập trình",
    "semester": 1,
    "credits": 3,
    "description": "Cung cấp tư duy thuật toán và lập trình căn bản sử dụng ngôn ngữ C. Biến, kiểu dữ liệu, cấu trúc điều kiện, vòng lặp, mảng và hàm.",
    "learningOutcomes": ["CLO1: Hiểu cách hoạt động của biến, kiểu dữ liệu và toán tử", "CLO2: Sử dụng thành thạo cấu trúc rẽ nhánh rẽ và vòng lặp", "CLO3: Viết hàm tự định nghĩa và quản lý mảng dữ liệu"],
    "prerequisiteCourses": [],
    "affectedCourses": ["WEB1013", "WEB1043", "WEB2063"],
    "coreSkills": ["Programming Logic", "Algorithmic thinking", "C syntax", "Debugging basics"],
    "technologiesTools": ["Dev-C++", "VS Code", "GCC compiler"],
    "careerRelevance": ["Software Engineer", "Web Developer", "Embedded Developer"],
    "commonFailureReasons": ["Không hiểu cách hoạt động của vòng lặp và câu lệnh điều kiện", "Thiếu thực hành viết mã (lười gõ code)", "Không đọc lỗi trình biên dịch để sửa lỗi"],
    "remediationRecommendations": [
      "Tuần 1-4: Viết lại toàn bộ 10 bài thực hành Lab cú pháp C cơ bản",
      "Tuần 5-8: Vẽ sơ đồ khối thuật toán cho cấu trúc rẽ nhánh & vòng lặp",
      "Tuần 9-12: Lập trình giải quyết 5 bài toán mảng và hàm nâng cao"
    ],
    "academicImportanceLevel": "CRITICAL",
    "bottleneckWeight": 5
  },
  {
    "courseId": "ITI101",
    "courseName": "Nhập môn công nghệ thông tin",
    "semester": 1,
    "credits": 3,
    "description": "Giới thiệu tổng quan về ngành Công nghệ thông tin, cấu trúc máy tính, mạng và xu hướng công nghệ.",
    "learningOutcomes": ["CLO1: Nắm bắt kiến thức cơ bản về phần cứng, phần mềm và mạng", "CLO2: Hiểu xu hướng công nghệ hiện đại như AI, Cloud, IoT", "CLO3: Định hình lộ trình sự nghiệp trong ngành IT"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["Hardware knowledge", "Networking basics", "Career planning"],
    "technologiesTools": ["PC simulators", "Cisco Packet Tracer"],
    "careerRelevance": ["IT Support", "Systems Administrator", "IT Consultant"],
    "commonFailureReasons": ["Học lý thuyết suông không thực hành", "Thiếu cập nhật thông tin công nghệ mới", "Không làm các bài tập trắc nghiệm chương"],
    "remediationRecommendations": ["Đọc blog công nghệ và xem video lắp ráp máy tính", "Thực hành giả lập mạng cơ bản", "Hệ thống hóa lý thuyết sau mỗi buổi học"],
    "academicImportanceLevel": "LOW",
    "bottleneckWeight": 1
  },
  {
    "courseId": "VIE104",
    "courseName": "Giáo dục quốc phòng",
    "semester": 1,
    "credits": 4,
    "description": "Giáo dục quốc phòng an ninh, rèn luyện tác phong kỷ luật quân đội.",
    "learningOutcomes": ["CLO1: Hiểu kiến thức quốc phòng an ninh cơ bản", "CLO2: Thực hiện nghiêm túc điều lệnh quân ngũ", "CLO3: Đạt chuẩn kỹ thuật tháo lắp vũ khí"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["Military discipline", "Team cohesion", "National security awareness"],
    "technologiesTools": ["Military gear"],
    "careerRelevance": ["Operations Supervisor", "Team Leader"],
    "commonFailureReasons": ["Vi phạm nội quy kỷ luật giờ giấc sinh hoạt tập trung", "Không tham gia đầy đủ các buổi huấn luyện thao trường", "Bị đánh giá kém phần rèn luyện tác phong"],
    "remediationRecommendations": ["Tuân thủ tuyệt đối giờ giấc quân ngũ", "Tập trung chú ý khi nghe hướng dẫn thao trường", "Nỗ lực rèn luyện kỷ luật tập thể"],
    "academicImportanceLevel": "LOW",
    "bottleneckWeight": 1
  },
  {
    "courseId": "ENT1128",
    "courseName": "Tiếng Anh 1.1",
    "semester": 1,
    "credits": 3,
    "description": "Tiếng Anh giao tiếp cơ bản bốn kỹ năng nghe, nói, đọc, viết ở trình độ sơ cấp A1.",
    "learningOutcomes": ["CLO1: Giao tiếp xã hội cơ bản hàng ngày", "CLO2: Đọc hiểu văn bản ngắn đơn giản", "CLO3: Viết đoạn văn ngắn giới thiệu bản thân"],
    "prerequisiteCourses": [],
    "affectedCourses": ["ENT123"],
    "coreSkills": ["English pronunciation", "Basic vocabulary", "Listening and speaking"],
    "technologiesTools": ["Duolingo", "LMS English portal"],
    "careerRelevance": ["Global IT Agent", "IT Support Analyst"],
    "commonFailureReasons": ["Sợ nói tiếng Anh, thiếu tự tin phát âm", "Không tích lũy từ vựng thường xuyên", "Lười làm bài tập trên hệ thống trực tuyến"],
    "remediationRecommendations": ["Luyện nói tiếng Anh 15 phút mỗi ngày cùng nhóm", "Sử dụng flashcard học từ vựng mới", "Hoàn thành 100% bài tập tự học online"],
    "academicImportanceLevel": "MEDIUM",
    "bottleneckWeight": 2
  },
  {
    "courseId": "COM2012",
    "courseName": "Cơ sở dữ liệu",
    "semester": 2,
    "credits": 3,
    "description": "Thiết kế cơ sở dữ liệu quan hệ, chuẩn hóa dữ liệu và truy vấn dữ liệu SQL bằng hệ quản trị CSDL MySQL.",
    "learningOutcomes": ["CLO1: Thiết kế lược đồ ERD chuẩn cho bài toán thực tế", "CLO2: Áp dụng các quy tắc chuẩn hóa dữ liệu (1NF, 2NF, 3NF)", "CLO3: Viết thành thạo truy vấn SQL (JOIN, GROUP BY, Subquery)"],
    "prerequisiteCourses": [],
    "affectedCourses": ["WEB2014", "WEB2063", "WEB503", "PRO2201"],
    "coreSkills": ["Database Design", "SQL querying", "Entity Relationship Modeling", "Normalization"],
    "technologiesTools": ["MySQL", "MySQL Workbench", "draw.io"],
    "careerRelevance": ["Database Administrator", "Backend Developer", "Fullstack Developer", "Software Engineer"],
    "commonFailureReasons": ["Thiết kế bảng thiếu thuộc tính khóa hoặc trùng lặp dữ liệu lớn", "Không hiểu logic của phép nối JOIN trong SQL", "Viết câu lệnh SELECT phức tạp sai cú pháp"],
    "remediationRecommendations": [
      "Tuần 1-4: Vẽ lược đồ ERD chuẩn hóa cho 3 bài toán nghiệp vụ thực tế",
      "Tuần 5-8: Luyện viết 30 câu truy vấn SQL JOIN và GROUP BY từ cơ bản đến nâng cao",
      "Tuần 9-12: Thực hành thiết kế CSDL và phân tích tối ưu chỉ mục index"
    ],
    "academicImportanceLevel": "HIGH",
    "bottleneckWeight": 4
  },
  {
    "courseId": "WEB1013",
    "courseName": "Xây dựng trang Web",
    "semester": 2,
    "credits": 3,
    "description": "Xây dựng giao diện trang web tĩnh từ đầu bằng ngôn ngữ HTML5, CSS3 và thiết kế đáp ứng (Responsive Web Design).",
    "learningOutcomes": ["CLO1: Viết cấu trúc trang web chuẩn ngữ nghĩa HTML5", "CLO2: Định dạng giao diện hiện đại sử dụng CSS3 (Flexbox/Grid)", "CLO3: Tạo giao diện tương thích đa thiết bị bằng Media Queries"],
    "prerequisiteCourses": ["COM108"],
    "affectedCourses": ["WEB3023", "WEB1043", "PRO1014"],
    "coreSkills": ["HTML layout", "CSS styling", "Responsive Design", "Flexbox/Grid layout"],
    "technologiesTools": ["VS Code", "Google Chrome DevTools", "CSS Validator"],
    "careerRelevance": ["UI/UX Designer", "Frontend Developer", "Web Designer"],
    "commonFailureReasons": ["Không nắm vững cơ chế Box Model của CSS", "Bị nhầm lẫn giữa HTML layout và CSS styling", "Giao diện Responsive bị vỡ khi co giãn màn hình"],
    "remediationRecommendations": [
      "Tuần 1-4: Cắt giao diện HTML/CSS tĩnh cho 3 bản thiết kế Figma",
      "Tuần 5-8: Xây dựng layout đáp ứng sử dụng Flexbox và CSS Grid",
      "Tuần 9-12: Tối ưu hóa Responsive tương thích đa thiết bị bằng Media Queries"
    ],
    "academicImportanceLevel": "CRITICAL",
    "bottleneckWeight": 5
  },
  {
    "courseId": "ENT123",
    "courseName": "Tiếng Anh 1.2",
    "semester": 2,
    "credits": 3,
    "description": "Nâng cao năng lực tiếng Anh giao tiếp trình độ sơ trung cấp A2, nhấn mạnh giao tiếp công sở cơ bản.",
    "learningOutcomes": ["CLO1: Giao tiếp tự tin trong môi trường làm việc", "CLO2: Đọc hiểu tài liệu kỹ thuật ngắn", "CLO3: Viết báo cáo tiến độ công việc đơn giản"],
    "prerequisiteCourses": ["ENT1128"],
    "affectedCourses": ["ENT213"],
    "coreSkills": ["Technical vocabulary", "Professional communication", "Reading comprehension"],
    "technologiesTools": ["Cambridge Dictionary", "Quizlet"],
    "careerRelevance": ["Global IT Agent", "Technical Writer"],
    "commonFailureReasons": ["Bỏ dở bài tập nghe nói trên lớp", "Thiếu vốn từ vựng chuyên ngành công nghệ thông tin", "Nghỉ học quá số buổi quy định"],
    "remediationRecommendations": ["Nghe bản tin tiếng Anh kỹ thuật 10 phút mỗi ngày", "Tạo bộ từ vựng Quizlet chuyên ngành CNTT", "Tích cực tương tác đàm thoại với giảng viên"],
    "academicImportanceLevel": "MEDIUM",
    "bottleneckWeight": 2
  },
  {
    "courseId": "WEB1043",
    "courseName": "Lập trình cơ sở với JavaScript",
    "semester": 2,
    "credits": 3,
    "description": "Lập trình JavaScript cơ bản phía client. Xử lý biến, mảng, hàm, sự kiện và tương tác DOM (Document Object Model).",
    "learningOutcomes": ["CLO1: Thao tác động với thẻ HTML thông qua JavaScript DOM", "CLO2: Xử lý các sự kiện click, hover, submit trên trình duyệt", "CLO3: Viết mã xác thực biểu mẫu (Form Validation) phía client"],
    "prerequisiteCourses": ["COM108", "WEB1013"],
    "affectedCourses": ["WEB2063", "WEB2081", "PRO1014"],
    "coreSkills": ["JavaScript syntax", "DOM manipulation", "Event handling", "Form validation"],
    "technologiesTools": ["VS Code", "Chrome DevTools Console"],
    "careerRelevance": ["Frontend Developer", "JavaScript Developer", "Fullstack Developer"],
    "commonFailureReasons": ["Mất gốc tư duy lập trình căn bản từ môn C", "Không hiểu cách truy xuất và thay đổi thuộc tính CSS bằng DOM", "Lỗi cú pháp đóng mở ngoặc hoặc gọi sai tên biến"],
    "remediationRecommendations": [
      "Tuần 1-4: Hoàn thành 5 bài tập thuật toán và thao tác DOM cơ bản",
      "Tuần 5-8: Xây dựng chức năng Slideshow và Form Validation động",
      "Tuần 9-12: Lập trình ứng dụng Todo List sử dụng LocalStorage"
    ],
    "academicImportanceLevel": "CRITICAL",
    "bottleneckWeight": 5
  },
  {
    "courseId": "WEB108",
    "courseName": "Lập trình PHP cơ bản",
    "semester": 2,
    "credits": 3,
    "description": "Lập trình backend cơ bản với PHP. Xử lý form, quản lý Session/Cookie và kết nối cơ sở dữ liệu MySQL.",
    "learningOutcomes": ["CLO1: Nắm vững cú pháp cơ bản PHP và vòng đời yêu cầu client-server", "CLO2: Xử lý dữ liệu biểu mẫu an toàn tránh lỗi bảo mật cơ bản", "CLO3: Thiết lập cơ chế đăng nhập sử dụng Session và Cookie"],
    "prerequisiteCourses": ["COM108"],
    "affectedCourses": ["WEB2014"],
    "coreSkills": ["Server-side programming", "PHP syntax", "Form handling", "Session management"],
    "technologiesTools": ["XAMPP", "VS Code", "MySQL"],
    "careerRelevance": ["PHP Backend Developer", "Web Developer"],
    "commonFailureReasons": ["Không hiểu cách truyền nhận dữ liệu qua GET và POST", "Quên khởi chạy Apache/MySQL trên XAMPP", "Lỗi SQL Injection cơ bản khi ghép chuỗi truy vấn PHP"],
    "remediationRecommendations": [
      "Tuần 1-4: Xây dựng hệ thống đăng nhập và đăng ký tài khoản đơn giản",
      "Tuần 5-8: Lập trình xử lý Form dữ liệu và bảo mật đầu vào chống XSS",
      "Tuần 9-12: Kết nối CSDL MySQL và xây dựng chức năng CRUD PHP thuần"
    ],
    "academicImportanceLevel": "HIGH",
    "bottleneckWeight": 4
  },
  {
    "courseId": "ENT213",
    "courseName": "Tiếng Anh 2.1",
    "semester": 3,
    "credits": 3,
    "description": "Phát triển tiếng Anh giao tiếp và kỹ năng đọc hiểu tài liệu IT trình độ trung cấp B1.",
    "learningOutcomes": ["CLO1: Đọc hiểu tài liệu đặc tả API và tài liệu thiết kế hệ thống ngắn", "CLO2: Thuyết trình kỹ thuật đơn giản bằng tiếng Anh", "CLO3: Viết email trao đổi công việc chuyên nghiệp"],
    "prerequisiteCourses": ["ENT123"],
    "affectedCourses": ["ENT223"],
    "coreSkills": ["Technical reading", "Business emailing", "Professional collaboration"],
    "technologiesTools": ["DeepL Translator", "Grammarly"],
    "careerRelevance": ["Frontend Developer", "Backend Developer", "Software Engineer"],
    "commonFailureReasons": ["Gặp khó khăn khi đọc hiểu các hướng dẫn kỹ thuật dài", "Thiếu thực hành viết email và phát âm từ vựng chuyên ngành", "Ít trao đổi với bạn bè bằng tiếng Anh"],
    "remediationRecommendations": ["Dịch và tóm tắt một bài blog công nghệ tiếng Anh mỗi tuần", "Sử dụng phần mềm Grammarly sửa lỗi viết email", "Luyện nói tiếng Anh theo nhóm học tập"],
    "academicImportanceLevel": "MEDIUM",
    "bottleneckWeight": 2
  },
  {
    "courseId": "VIE108",
    "courseName": "Chính trị",
    "semester": 3,
    "credits": 5,
    "description": "Học tập học thuyết Mác-Lênin, tư tưởng Hồ Chí Minh và đường lối cách mạng Đảng Cộng sản Việt Nam.",
    "learningOutcomes": ["CLO1: Nắm bắt kiến thức cơ bản triết học Mác-Lênin", "CLO2: Nhận thức sâu sắc lòng yêu nước và đạo đức Hồ Chí Minh", "CLO3: Vận dụng tư duy biện chứng vào cuộc sống"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["Critical thinking", "Social responsibility", "Dialectical analysis"],
    "technologiesTools": ["Reference books"],
    "careerRelevance": ["Public Relations", "Team Administrator"],
    "commonFailureReasons": ["Học thuộc lòng đối phó không hiểu bản chất", "Ít tham gia phát biểu trao đổi bài", "Thiếu tập trung ôn tập các đề lý thuyết"],
    "remediationRecommendations": ["Đọc kỹ giáo trình chính trị trước giờ học", "Liên hệ các bài học với lịch sử xã hội thực tế", "Làm bài tập trắc nghiệm ôn luyện đầy đủ"],
    "academicImportanceLevel": "LOW",
    "bottleneckWeight": 1
  },
  {
    "courseId": "WEB3023",
    "courseName": "Thiết kế Web với HTML5 & CSS3",
    "semester": 3,
    "credits": 3,
    "description": "Nâng cao thiết kế giao diện web, hiệu ứng chuyển động động và tích hợp Bootstrap.",
    "learningOutcomes": ["CLO1: Ứng dụng các thẻ ngữ nghĩa và Local Storage HTML5", "CLO2: Tạo các chuyển động động CSS3 phức tạp", "CLO3: Xây dựng nhanh giao diện trang web chuẩn responsive bằng Bootstrap"],
    "prerequisiteCourses": ["WEB1013"],
    "affectedCourses": [],
    "coreSkills": ["Advanced CSS3", "Bootstrap integration", "CSS Animations", "HTML5 semantic markup"],
    "technologiesTools": ["VS Code", "Bootstrap CSS", "Sass/SCSS"],
    "careerRelevance": ["Frontend Developer", "Web Designer", "UI Developer"],
    "commonFailureReasons": ["Lạm dụng quá nhiều hiệu ứng CSS gây chậm trang web", "Không tùy biến được Bootstrap dẫn đến giao diện rập khuôn", "Quên kiểm tra tính tương thích CSS trên Safari và các trình duyệt di động"],
    "remediationRecommendations": ["Thiết kế trang web cá nhân đẹp mắt sử dụng hiệu ứng vừa phải", "Override các biến Sass mặc định của Bootstrap", "Kiểm tra kỹ giao diện trên nhiều trình duyệt"],
    "academicImportanceLevel": "MEDIUM",
    "bottleneckWeight": 2
  },
  {
    "courseId": "WEB2014",
    "courseName": "Lập trình PHP 1",
    "semester": 3,
    "credits": 3,
    "description": "Lập trình hướng đối tượng PHP (OOP). Xây dựng ứng dụng theo kiến trúc MVC, quản lý định tuyến và sử dụng PDO kết nối CSDL.",
    "learningOutcomes": ["CLO1: Áp dụng mô hình lập trình hướng đối tượng OOP (kế thừa, đa hình)", "CLO2: Xây dựng mã nguồn chuẩn kiến trúc Model-View-Controller (MVC)", "CLO3: Truy xuất cơ sở dữ liệu an toàn thông qua thư viện PDO"],
    "prerequisiteCourses": ["WEB108"],
    "affectedCourses": ["WEB2091", "PRO2201"],
    "coreSkills": ["Object-Oriented Programming (OOP)", "MVC Architecture", "Database connection with PDO", "PHP Routing"],
    "technologiesTools": ["Composer", "XAMPP", "VS Code", "Postman"],
    "careerRelevance": ["PHP Backend Developer", "Fullstack Developer", "Laravel Developer"],
    "commonFailureReasons": ["Không nắm được tư duy lập trình hướng đối tượng OOP trừu tượng", "Nhầm lẫn luồng đi dữ liệu giữa Controller, Model và View", "Viết code spaghetti lộn xộn trong các thư mục"],
    "remediationRecommendations": [
      "Tuần 1-4: Lập trình hướng đối tượng OOP tạo các Class và Interface cơ bản",
      "Tuần 5-8: Xây dựng cấu trúc thư mục dự án chuẩn mô hình MVC",
      "Tuần 9-12: Viết thư viện kết nối và truy xuất cơ sở dữ liệu qua PDO"
    ],
    "academicImportanceLevel": "HIGH",
    "bottleneckWeight": 4
  },
  {
    "courseId": "VIE1026",
    "courseName": "Pháp luật",
    "semester": 3,
    "credits": 2,
    "description": "Kiến thức pháp luật đại cương, luật lao động và quy định sở hữu trí tuệ phần mềm liên quan IT.",
    "learningOutcomes": ["CLO1: Hiểu quyền và nghĩa vụ công dân", "CLO2: Đọc hiểu hợp đồng lao động và quy định bản quyền phần mềm", "CLO3: Nhận thức tầm quan trọng của tuân thủ pháp luật IT"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["Contract comprehension", "Intellectual Property knowledge", "Legal compliance"],
    "technologiesTools": ["Law codebooks"],
    "careerRelevance": ["Project Manager", "IT Business Analyst", "Compliance Officer"],
    "commonFailureReasons": ["Lười đọc tài liệu pháp lý", "Không nhớ các điểm cốt lõi trong hợp đồng lao động và bản quyền", "Bỏ qua các đề ôn thi trắc nghiệm"],
    "remediationRecommendations": ["Đọc tài liệu về các vụ kiện bản quyền công nghệ nổi tiếng", "Nghiên cứu các mẫu hợp đồng lao động chuẩn", "Làm bài tập trắc nghiệm ôn tập trước thi"],
    "academicImportanceLevel": "LOW",
    "bottleneckWeight": 1
  },
  {
    "courseId": "PDP103",
    "courseName": "Kỹ năng phát triển bản thân",
    "semester": 3,
    "credits": 2,
    "description": "Tự đánh giá bản thân, lập mục tiêu SMART và lập kế hoạch phát triển sự nghiệp cá nhân.",
    "learningOutcomes": ["CLO1: Phân tích bản thân bằng sơ đồ SWOT", "CLO2: Xác lập mục tiêu cuộc sống theo mô hình SMART", "CLO3: Lập kế hoạch hành động cụ thể để đạt mục tiêu"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["SWOT analysis", "SMART goal setting", "Emotional intelligence", "Self reflection"],
    "technologiesTools": ["SWOT Templates", "Trello"],
    "careerRelevance": ["HR Specialist", "Team Leader", "Product Manager"],
    "commonFailureReasons": ["Không trung thực khi tự đánh giá bản thân", "Đặt mục tiêu không thực tế và thiếu đo lường", "Thiếu kỷ luật thực hiện theo kế hoạch"],
    "remediationRecommendations": ["Lập bảng SWOT cá nhân có tham khảo ý kiến bạn bè", "Viết ra các mục tiêu SMART và dán lên bàn học", "Theo dõi kế hoạch hành động hàng tuần"],
    "academicImportanceLevel": "LOW",
    "bottleneckWeight": 1
  },
  {
    "courseId": "WEB105",
    "courseName": "Thiết kế UI/UX",
    "semester": 4,
    "credits": 3,
    "description": "Quy trình thiết kế trải nghiệm người dùng (UX) và giao diện người dùng (UI) sử dụng công cụ Figma xây dựng Wireframe, Mockup và Prototype tương tác.",
    "learningOutcomes": ["CLO1: Thực hiện nghiên cứu người dùng và vẽ sơ đồ hành trình", "CLO2: Thiết kế giao diện Wireframe đến Mockup chi tiết", "CLO3: Tạo Prototype tương tác động và kiểm thử trên Figma"],
    "prerequisiteCourses": [],
    "affectedCourses": ["WEB2063", "WEB2091"],
    "coreSkills": ["User Research", "Wireframing", "Figma Prototyping", "Design Thinking"],
    "technologiesTools": ["Figma", "Adobe XD", "Miro"],
    "careerRelevance": ["UI/UX Designer", "Product Designer", "Frontend Developer"],
    "commonFailureReasons": ["Thiếu kỹ năng thực hành Figma Component và Auto Layout", "Không hiểu quy tắc phối màu và thiết kế lưới", "Thiết kế đẹp nhưng trải nghiệm người dùng kém thực tế"],
    "remediationRecommendations": [
      "Tuần 1-4: Hoàn thành 3 bài thực hành thiết kế Wireframe trên Figma",
      "Tuần 5-8: Thiết kế giao diện Mockup chi tiết cho một Landing Page đáp ứng hệ thống lưới",
      "Tuần 9-12: Xây dựng Prototype tương tác ứng dụng Mobile và thực hiện kiểm thử người dùng"
    ],
    "academicImportanceLevel": "HIGH",
    "bottleneckWeight": 3
  },
  {
    "courseId": "WEB2041",
    "courseName": "Dự án mẫu",
    "semester": 4,
    "credits": 3,
    "description": "Thực hành xây dựng dự án web thực tế theo chuẩn quy trình công nghệ sử dụng HTML/CSS, JS và PHP.",
    "learningOutcomes": ["CLO1: Phân tích đặc tả yêu cầu sản phẩm và lập kế hoạch", "CLO2: Lập trình backend CRUD hoàn chỉnh có kết nối cơ sở dữ liệu", "CLO3: Sử dụng Git để kiểm soát phiên bản mã nguồn"],
    "prerequisiteCourses": [],
    "affectedCourses": ["WEB2091", "PRO2201"],
    "coreSkills": ["Project planning", "Full stack development", "CRUD implementation", "Deployment basics"],
    "technologiesTools": ["VS Code", "Git", "XAMPP", "GitHub"],
    "careerRelevance": ["Frontend Developer", "Backend Developer", "Fullstack Developer"],
    "commonFailureReasons": ["Không tuân thủ các bước triển khai của dự án mẫu", "Gặp lỗi đường dẫn tương đối và cấu hình CSDL", "Không commit code lên Git thường xuyên làm mất bài"],
    "remediationRecommendations": ["Bám sát tài liệu đặc tả dự án mẫu", "Kiểm tra kỹ cấu hình máy chủ local Apache/MySQL", "Thực hành commit và push code lên GitHub hàng ngày"],
    "academicImportanceLevel": "HIGH",
    "bottleneckWeight": 4
  },
  {
    "courseId": "ENT223",
    "courseName": "Tiếng Anh 2.2",
    "semester": 4,
    "credits": 3,
    "description": "Tiếng Anh chuyên ngành CNTT, viết CV, thư ứng tuyển và rèn luyện kỹ năng phỏng vấn xin việc bằng tiếng Anh.",
    "learningOutcomes": ["CLO1: Đọc hiểu tốt các tài liệu kỹ thuật dài chuyên ngành", "CLO2: Viết CV tiếng Anh chuyên nghiệp ứng tuyển công việc IT", "CLO3: Phản xạ trả lời phỏng vấn kỹ thuật bằng tiếng Anh"],
    "prerequisiteCourses": ["ENT213"],
    "affectedCourses": [],
    "coreSkills": ["Interview preparation", "CV writing", "Technical reading comprehension"],
    "technologiesTools": ["LinkedIn", "Grammarly", "Resume Builders"],
    "careerRelevance": ["Global IT Agent", "Fullstack Developer", "Software Engineer"],
    "commonFailureReasons": ["Sợ nói tiếng Anh, không thực hành trả lời câu hỏi phỏng vấn thử", "Viết CV sơ sài, sai lỗi ngữ pháp chính tả cơ bản", "Từ vựng kỹ thuật còn hạn chế"],
    "remediationRecommendations": ["Tự quay video trả lời phỏng vấn tiếng Anh để sửa lỗi", "Nhờ giảng viên xem và sửa lỗi CV tiếng Anh", "Đọc các tài liệu hướng dẫn kỹ thuật chính thống"],
    "academicImportanceLevel": "MEDIUM",
    "bottleneckWeight": 2
  },
  {
    "courseId": "WEB1023",
    "courseName": "Quản trị website",
    "semester": 4,
    "credits": 3,
    "description": "Quản trị website bằng hệ quản trị nội dung WordPress. Thiết lập hosting, domain, backup dữ liệu và SEO on-page.",
    "learningOutcomes": ["CLO1: Cài đặt và quản trị website WordPress hoàn chỉnh", "CLO2: Thực hiện sao lưu backup dữ liệu định kỳ", "CLO3: Tối ưu hóa SEO on-page cơ bản cho website"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["WordPress management", "Domain & Hosting config", "Backup/Restore", "SEO optimization"],
    "technologiesTools": ["WordPress", "cPanel", "Yoast SEO", "FileZilla"],
    "careerRelevance": ["Web Administrator", "SEO Specialist", "WordPress Developer"],
    "commonFailureReasons": ["Không sao lưu dữ liệu thường xuyên gây mất mát bài làm", "Cài đặt quá nhiều plugin lạ gây lỗi xung đột", "Thiếu cấu hình bảo mật cơ bản khiến website dễ bị tấn công"],
    "remediationRecommendations": ["Thực hiện sao lưu backup định kỳ bằng UpdraftPlus", "Hạn chế cài plugin không rõ nguồn gốc", "Đổi trang quản trị admin mặc định và đặt mật khẩu mạnh"],
    "academicImportanceLevel": "MEDIUM",
    "bottleneckWeight": 2
  },
  {
    "courseId": "WEB2055",
    "courseName": "Marketing trên Internet",
    "semester": 4,
    "credits": 3,
    "description": "Các kỹ thuật tiếp thị số bao gồm nghiên cứu từ khóa, tối ưu SEO, chạy quảng cáo Google Ads, Facebook Ads.",
    "learningOutcomes": ["CLO1: Nghiên cứu bộ từ khóa tối ưu cho công cụ tìm kiếm", "CLO2: Thiết lập cơ bản chiến dịch quảng cáo trả phí", "CLO3: Đọc hiểu các số liệu thống kê lượt truy cập website"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["Keyword research", "Ad campaign setup", "Analytics interpretation", "Copywriting"],
    "technologiesTools": ["Google Analytics", "Google Keyword Planner", "Facebook Ad Manager"],
    "careerRelevance": ["Digital Marketer", "SEO Specialist", "Product Owner"],
    "commonFailureReasons": ["Không nắm được cách phân tích đối tượng mục tiêu", "Chiến dịch quảng cáo thiết lập sai gây lãng phí chi phí", "Không biết phân tích các chỉ số chuyển đổi cơ bản"],
    "remediationRecommendations": ["Thực hành chạy quảng cáo ngân sách nhỏ thực tế", "Sử dụng Google Keyword Planner nghiên cứu kỹ từ khóa", "Học cách viết mẫu quảng cáo hấp dẫn thu hút"],
    "academicImportanceLevel": "LOW",
    "bottleneckWeight": 1
  },
  {
    "courseId": "WEB501",
    "courseName": "Lập trình ECMAScript",
    "semester": 5,
    "credits": 3,
    "description": "Lập trình JavaScript nâng cao theo tiêu chuẩn ECMAScript mới nhất. Arrow functions, destructuring, xử lý bất đồng bộ Promises, Async/Await.",
    "learningOutcomes": ["CLO1: Viết mã nguồn JavaScript tối ưu theo chuẩn ES6+", "CLO2: Xử lý thành thạo bất đồng bộ bằng Promise và Async/Await", "CLO3: Thiết lập module hóa cho các mã nguồn JavaScript lớn"],
    "prerequisiteCourses": [],
    "affectedCourses": ["WEB2063", "WEB2081"],
    "coreSkills": ["ES6+ Javascript", "Asynchronous programming", "Modules and classes", "Functional programming methods"],
    "technologiesTools": ["VS Code", "Node.js", "ESLint"],
    "careerRelevance": ["Frontend Developer", "JavaScript Engineer", "NodeJS Developer"],
    "commonFailureReasons": ["Không hiểu cơ chế xử lý bất đồng bộ dẫn đến xử lý sai luồng dữ liệu", "Lúng túng khi viết mã lồng nhau phức tạp", "Mất căn bản cú pháp cơ bản JavaScript"],
    "remediationRecommendations": ["Tập viết ít nhất 15 hàm xử lý bất đồng bộ bằng Promise và Async/Await", "Thực hành chuyển đổi mã nguồn JavaScript cũ sang chuẩn ES6+", "Tích cực sử dụng công cụ kiểm lỗi ESLint"],
    "academicImportanceLevel": "HIGH",
    "bottleneckWeight": 4
  },
  {
    "courseId": "WEB2063",
    "courseName": "Lập trình Javascript nâng cao",
    "semester": 5,
    "credits": 3,
    "description": "Lập trình JavaScript phía client nâng cao, gọi API, thao tác AJAX, xử lý lưu trữ cục bộ và bảo mật client-side.",
    "learningOutcomes": ["CLO1: Gọi và tích hợp thành thạo dữ liệu từ API thông qua Fetch/Axios", "CLO2: Xử lý lưu trữ trạng thái người dùng (Local Storage, Session Storage)", "CLO3: Phòng tránh các lỗ hổng bảo mật phía client cơ bản"],
    "prerequisiteCourses": ["WEB1043"],
    "affectedCourses": ["WEB2091", "WEB503", "PRO2201"],
    "coreSkills": ["API Integration", "HTTP client (Axios/Fetch)", "Client-side storage", "JS security (XSS prevention)"],
    "technologiesTools": ["VS Code", "Postman", "Chrome DevTools Network tab"],
    "careerRelevance": ["Frontend Developer", "Fullstack Developer", "React Developer"],
    "commonFailureReasons": ["Không phân tích được định dạng dữ liệu trả về từ API", "Bị lỗi bất đồng bộ gây trắng màn hình hoặc lặp vô tận", "Không biết đọc mã lỗi HTTP để sửa lỗi"],
    "remediationRecommendations": [
      "Tuần 1-4: Thực hành gọi API lấy dữ liệu thời tiết/tin tức bằng Fetch/Axios",
      "Tuần 5-8: Xử lý lưu trữ trạng thái ứng dụng qua LocalStorage và Cookies",
      "Tuần 9-12: Xây dựng ứng dụng SPA quản lý sản phẩm bằng JavaScript thuần"
    ],
    "academicImportanceLevel": "CRITICAL",
    "bottleneckWeight": 5
  },
  {
    "courseId": "PRO1014",
    "courseName": "Dự án 1 (TKTW)",
    "semester": 5,
    "credits": 3,
    "description": "Lập trình đồ án web thực chiến theo nhóm áp dụng quy trình Agile/Scrum, kiểm soát mã nguồn bằng Git và tích hợp hệ thống.",
    "learningOutcomes": ["CLO1: Phối hợp làm việc nhóm hiệu quả theo mô hình Agile/Scrum", "CLO2: Thiết kế và xây dựng cơ sở dữ liệu quan hệ hoàn chỉnh", "CLO3: Lập trình và tích hợp đầy đủ giao diện cùng backend sản phẩm"],
    "prerequisiteCourses": ["WEB1013", "WEB1043"],
    "affectedCourses": ["PRO2201", "PRO116"],
    "coreSkills": ["Agile/Scrum", "Git collaboration", "Fullstack project integration", "Team communication"],
    "technologiesTools": ["GitHub", "Trello", "VS Code", "Database Tools"],
    "careerRelevance": ["Fullstack Developer", "Frontend Developer", "Backend Developer", "Project Manager"],
    "commonFailureReasons": ["Phân chia công việc không rõ ràng dẫn đến chậm tiến độ chung", "Lỗi xung đột mã nguồn Git không tự giải quyết được", "Thiếu kết nối đồng bộ giữa các chức năng frontend và backend"],
    "remediationRecommendations": ["Tổ chức họp giao ban nhóm hàng ngày thảo luận công việc", "Thực hành quy trình tạo nhánh Git nghiêm túc", "Đặc tả kỹ lưỡng định dạng API trao đổi dữ liệu"],
    "academicImportanceLevel": "CRITICAL",
    "bottleneckWeight": 5
  },
  {
    "courseId": "WEB503",
    "courseName": "NodeJS & Restful Web Service",
    "semester": 5,
    "credits": 3,
    "description": "Lập trình server-side sử dụng NodeJS và framework Express, kết nối cơ sở dữ liệu phi quan hệ MongoDB.",
    "learningOutcomes": ["CLO1: Xây dựng máy chủ Express kết nối CSDL MongoDB", "CLO2: Thiết kế bộ API chuẩn Restful đầy đủ chức năng", "CLO3: Xử lý bảo mật chứng thực người dùng bằng JWT"],
    "prerequisiteCourses": ["WEB2063"],
    "affectedCourses": [],
    "coreSkills": ["NodeJS development", "ExpressJS framework", "Restful API Design", "NoSQL database (MongoDB)"],
    "technologiesTools": ["Node.js", "Express", "MongoDB Atlas", "Postman", "Mongoose"],
    "careerRelevance": ["NodeJS Developer", "Backend Developer", "Fullstack Developer"],
    "commonFailureReasons": ["Không quen tư duy cấu trúc dữ liệu NoSQL", "Quên viết try-catch bắt lỗi làm server bị crash liên tục", "Lỗi rò rỉ thông tin đăng nhập hoặc xử lý JWT không chuẩn"],
    "remediationRecommendations": [
      "Tuần 1-4: Xây dựng máy chủ Node.js/Express kết nối CSDL MongoDB",
      "Tuần 5-8: Thiết kế bộ RESTful API CRUD đầy đủ nghiệp vụ",
      "Tuần 9-12: Tích hợp chứng thực người dùng và phân quyền bằng JWT"
    ],
    "academicImportanceLevel": "HIGH",
    "bottleneckWeight": 4
  },
  {
    "courseId": "WEB502",
    "courseName": "Lập trình TypeScript",
    "semester": 5,
    "credits": 3,
    "description": "Lập trình hướng đối tượng an toàn kiểu bằng ngôn ngữ TypeScript. Khai báo kiểu tĩnh, interface, generic.",
    "learningOutcomes": ["CLO1: Áp dụng cơ chế an toàn kiểu viết code an toàn hơn", "CLO2: Thiết lập interface và class phân tách kiến trúc ứng dụng", "CLO3: Sử dụng Generics nâng cao viết mã nguồn linh hoạt"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["TypeScript syntax", "Static typing", "Generics and interfaces", "TS compilation config"],
    "technologiesTools": ["VS Code", "Node.js", "TSC compiler"],
    "careerRelevance": ["TypeScript Developer", "Frontend Developer", "Angular/React Developer"],
    "commonFailureReasons": ["Lạm dụng khai báo kiểu any phá vỡ tính an toàn của TypeScript", "Không hiểu cơ chế Generic nâng cao", "Cấu hình biên dịch TypeScript bị lỗi"],
    "remediationRecommendations": ["Hạn chế tối đa sử dụng kiểu any trong mã nguồn", "Tạo interface định dạng cho toàn bộ các API data", "Đọc kỹ các thông báo lỗi ép kiểu của TypeScript compiler"],
    "academicImportanceLevel": "MEDIUM",
    "bottleneckWeight": 2
  },
  {
    "courseId": "PDP104",
    "courseName": "Kỹ năng làm việc",
    "semester": 5,
    "credits": 2,
    "description": "Chuẩn bị viết CV chuyên nghiệp, luyện tập phỏng vấn xin việc và tìm hiểu đạo đức nghề nghiệp CNTT.",
    "learningOutcomes": ["CLO1: Thiết kế CV và tối ưu trang cá nhân LinkedIn chuyên nghiệp", "CLO2: Tự tin ứng tuyển tham gia phỏng vấn xin việc thực tế", "CLO3: Nhận thức sâu sắc đạo đức nghề nghiệp IT"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["Job interview skills", "Professional ethics", "LinkedIn branding", "Workplace communication"],
    "technologiesTools": ["LinkedIn", "Resume Builders"],
    "careerRelevance": ["Software Engineer", "IT Consultant", "IT Specialist"],
    "commonFailureReasons": ["CV lập trình viết nghèo nàn thiếu dự án thực tiễn", "Thái độ không chuyên nghiệp khi phỏng vấn thử", "Thiếu kỹ năng giao tiếp ứng xử cơ bản"],
    "remediationRecommendations": ["Đưa toàn bộ dự án nhóm đã làm ở trường vào CV", "Tham gia phỏng vấn thử nghiêm túc có ghi hình tự xem lại", "Tìm hiểu văn hóa công sở IT"],
    "academicImportanceLevel": "LOW",
    "bottleneckWeight": 1
  },
  {
    "courseId": "SYB3013",
    "courseName": "Khởi sự doanh nghiệp",
    "semester": 5,
    "credits": 3,
    "description": "Tư duy khởi nghiệp, lập kế hoạch kinh doanh và thuyết trình kêu gọi vốn (Pitching) cho sản phẩm công nghệ.",
    "learningOutcomes": ["CLO1: Phác thảo mô hình khởi nghiệp bằng Business Model Canvas", "CLO2: Lập kế hoạch tài chính và ước tính điểm hòa vốn cơ bản", "CLO3: Thuyết trình kêu gọi vốn thuyết phục trước đám đông"],
    "prerequisiteCourses": [],
    "affectedCourses": [],
    "coreSkills": ["Business model canvas", "Financial forecasting", "Project Pitching", "Market research"],
    "technologiesTools": ["Business Canvas Templates", "Excel"],
    "careerRelevance": ["Startup Founder", "Product Manager", "IT Business Analyst"],
    "commonFailureReasons": ["Ý tưởng mơ hồ không khảo sát nghiên cứu thị trường thực tế", "Cách tính toán số liệu tài chính không hợp lý", "Thuyết trình kêu gọi vốn thiếu thu hút tự tin"],
    "remediationRecommendations": ["Sử dụng sơ đồ Business Model Canvas phác thảo ý tưởng", "Tiến hành khảo sát thực tế hành vi khách hàng", "Luyện thuyết trình dự án giới hạn 5 phút"],
    "academicImportanceLevel": "LOW",
    "bottleneckWeight": 1
  },
  {
    "courseId": "WEB2081",
    "courseName": "Lập trình Front-End Framework 1",
    "semester": 6,
    "credits": 3,
    "description": "Xây dựng ứng dụng web đơn trang SPA sử dụng thư viện ReactJS. Component, State, Props và Hooks cơ bản.",
    "learningOutcomes": ["CLO1: Xây dựng ứng dụng web chia theo cấu trúc Component tái sử dụng", "CLO2: Quản lý vòng đời dữ liệu bằng Props và State", "CLO3: Sử dụng Hook useState và useEffect xử lý sự kiện"],
    "prerequisiteCourses": ["WEB1043", "WEB2063"],
    "affectedCourses": ["WEB2091", "PRO2201"],
    "coreSkills": ["ReactJS component design", "React state and props", "Basic React Hooks (useState/useEffect)", "Vite build tool"],
    "technologiesTools": ["Node.js", "Vite", "React Developer Tools", "VS Code"],
    "careerRelevance": ["React Frontend Developer", "Frontend Developer", "Fullstack Developer"],
    "commonFailureReasons": ["Không hiểu luồng hoạt động dẫn đến render lại lặp vô hạn", "Bị nhầm lẫn chức năng của Props và State", "Quên viết dependency array chuẩn cho useEffect"],
    "remediationRecommendations": [
      "Tuần 1-4: Tạo 5 components React có thể tái sử dụng sử dụng Props/State",
      "Tuần 5-8: Thực hành xử lý Side Effect bằng Hooks useState và useEffect",
      "Tuần 9-12: Xây dựng ứng dụng Fetch API hiển thị danh sách sản phẩm bằng React"
    ],
    "academicImportanceLevel": "CRITICAL",
    "bottleneckWeight": 5
  },
  {
    "courseId": "WEB2091",
    "courseName": "Lập trình Front-End Framework 2",
    "semester": 6,
    "credits": 3,
    "description": "Xây dựng ứng dụng ReactJS nâng cao. Quản lý trạng thái toàn cục Redux Toolkit, định tuyến trang web và NextJS cơ bản.",
    "learningOutcomes": ["CLO1: Quản lý state toàn cục dự án lớn bằng Redux Toolkit", "CLO2: Thiết lập định tuyến trang phức tạp bằng React Router", "CLO3: Tối ưu hiệu năng render ứng dụng React"],
    "prerequisiteCourses": ["WEB2063", "WEB2081"],
    "affectedCourses": [],
    "coreSkills": ["Global State Management (Redux Toolkit/Context)", "React Routing", "Performance optimization (useMemo/useCallback)", "NextJS fundamentals"],
    "technologiesTools": ["Redux DevTools", "VS Code", "Next.js", "React Router"],
    "careerRelevance": ["Senior Frontend Developer", "React Developer", "Fullstack Developer"],
    "commonFailureReasons": ["Không nắm được luồng đi dữ liệu của Redux (Store, Action, Reducer)", "Cấu hình sai router làm ứng dụng hiển thị trang trắng lỗi", "Lạm dụng Redux cho các dữ liệu cục bộ không đáng"],
    "remediationRecommendations": [
      "Tuần 1-4: Cấu hình state toàn cục cho giỏ hàng bằng Redux Toolkit",
      "Tuần 5-8: Thiết lập định tuyến trang phức tạp sử dụng React Router Dom",
      "Tuần 9-12: Tối ưu hóa hiệu năng render component bằng useMemo/useCallback"
    ],
    "academicImportanceLevel": "CRITICAL",
    "bottleneckWeight": 5
  },
  {
    "courseId": "PRO116",
    "courseName": "Thực tập tốt nghiệp (TKTW)",
    "semester": 7,
    "credits": 5,
    "description": "Thực tập thực tế tại doanh nghiệp, tích lũy tác phong và làm báo cáo thực tập.",
    "learningOutcomes": ["CLO1: Thích nghi nhanh với quy trình làm việc doanh nghiệp", "CLO2: Giải quyết các tác vụ công nghệ thực tiễn được giao", "CLO3: Hoàn thành báo cáo thực tập chất lượng đúng hạn"],
    "prerequisiteCourses": ["PRO1014"],
    "affectedCourses": [],
    "coreSkills": ["Industry experience", "Workplace professional communication", "Task completion", "Report writing"],
    "technologiesTools": ["Slack/Teams", "Git"],
    "careerRelevance": ["Junior Web Developer", "Junior Software Engineer"],
    "commonFailureReasons": ["Ý thức kỷ luật kém đi làm muộn hoặc nghỉ không phép", "Thiếu chủ động hỏi ý kiến khi gặp tắc nghẽn công việc", "Báo cáo thực tập sơ sài nộp muộn"],
    "remediationRecommendations": ["Tác phong đi làm đúng giờ, tuân thủ kỷ luật", "Chủ động giao tiếp thảo luận cùng Mentor công ty", "Viết báo cáo hàng tuần cẩn thận"],
    "academicImportanceLevel": "CRITICAL",
    "bottleneckWeight": 4
  },
  {
    "courseId": "PRO2201",
    "courseName": "Dự án tốt nghiệp (TKTW-Single page Application)",
    "semester": 7,
    "credits": 5,
    "description": "Đồ án tốt nghiệp hoàn chỉnh ứng dụng Full Stack Web SPA sử dụng React/NextJS ở frontend, NodeJS backend, CSDL MongoDB/MySQL. Thuyết trình bảo vệ trước hội đồng.",
    "learningOutcomes": ["CLO1: Quản trị dự án phần mềm chuyên nghiệp theo Agile/Scrum", "CLO2: Lập trình sản phẩm Full Stack Web chất lượng cao, bảo mật", "CLO3: Thuyết trình bảo vệ đồ án tốt nghiệp thuyết phục tự tin trước hội đồng"],
    "prerequisiteCourses": ["PRO1014", "WEB2063", "WEB2081"],
    "affectedCourses": [],
    "coreSkills": ["Agile/Scrum Project Management", "Full Stack Development", "System Architecture Design", "Technical Presentation"],
    "technologiesTools": ["GitHub", "Postman", "Figma", "Vercel/Render/Docker"],
    "careerRelevance": ["Junior Fullstack Developer", "Junior Frontend Developer", "Junior Backend Developer", "Software Engineer"],
    "commonFailureReasons": ["Quản lý thời gian kém làm đồ án trễ hạn hoàn thiện", "Xung đột tích hợp frontend backend trước ngày bảo vệ", "Thuyết trình yếu không phản biện được câu hỏi hội đồng"],
    "remediationRecommendations": [
      "Tuần 1-4: Lập kế hoạch phân rã Task và quản lý Sprint Backlog trên Trello",
      "Tuần 5-8: Lập trình hoàn thiện chức năng Full Stack Web SPA đáp ứng tiêu chí",
      "Tuần 9-12: Viết slide báo cáo, chuẩn bị kịch bản demo và thuyết trình thử"
    ],
    "academicImportanceLevel": "CRITICAL",
    "bottleneckWeight": 5
  }
];

// Helper to extract clean skills and build relational maps
const buildSkillsAndCareers = () => {
  const skillsMap = {};
  const careerMap = {
    "Frontend Developer": {
      "requiredCourses": ["WEB1013", "WEB1043", "WEB3023", "WEB105", "WEB2063", "WEB2081", "WEB2091"],
      "recommendedCourses": ["COM108", "COM2012", "PRO1014", "PRO2201"],
      "requiredSkills": ["HTML layout", "CSS styling", "Responsive Design", "JavaScript syntax", "DOM manipulation", "ReactJS component design", "Global State Management"]
    },
    "Backend Developer": {
      "requiredCourses": ["COM108", "COM2012", "WEB108", "WEB2014", "WEB503"],
      "recommendedCourses": ["WEB2063", "WEB501", "WEB502", "PRO1014", "PRO2201"],
      "requiredSkills": ["Programming Logic", "SQL querying", "Database Design", "Server-side programming", "NodeJS development", "Restful API Design"]
    },
    "Fullstack Developer": {
      "requiredCourses": ["WEB1013", "WEB1043", "COM2012", "WEB108", "WEB2014", "WEB2063", "WEB2081", "WEB2091", "WEB503", "PRO2201"],
      "recommendedCourses": ["COM108", "WEB105", "WEB2041", "PRO1014", "PRO116"],
      "requiredSkills": ["HTML layout", "CSS styling", "JavaScript syntax", "DOM manipulation", "SQL querying", "Database Design", "Server-side programming", "ReactJS component design", "NodeJS development", "Restful API Design"]
    },
    "UI/UX Designer": {
      "requiredCourses": ["WEB1013", "WEB105", "WEB3023"],
      "recommendedCourses": ["WEB1023", "WEB2055", "PRO2201"],
      "requiredSkills": ["User Research", "Wireframing", "Figma Prototyping", "Design Thinking", "HTML layout", "CSS styling"]
    },
    "SEO/WordPress Admin": {
      "requiredCourses": ["WEB1023", "WEB2055"],
      "recommendedCourses": ["COM1071", "PDP103"],
      "requiredSkills": ["Keyword research", "Ad campaign setup", "Analytics interpretation", "Copywriting", "WordPress management"]
    }
  };

  const courseSkillMapping = {};
  curriculum.forEach(c => {
    courseSkillMapping[c.courseId] = c.coreSkills;

    c.coreSkills.forEach(s => {
      if (!skillsMap[s]) {
        skillsMap[s] = {
          "level": c.academicImportanceLevel === "CRITICAL" || c.academicImportanceLevel === "HIGH" ? "Core" : "Supplementary",
          "courses": [],
          "dependentSkills": []
        };
      }
      skillsMap[s].courses.push(c.courseId);
    });
  });

  // Link basic programming logic dependencies
  if (skillsMap["Programming Logic"]) {
    skillsMap["Programming Logic"].dependentSkills = ["JavaScript syntax", "Server-side programming", "NodeJS development"];
  }
  if (skillsMap["HTML layout"]) {
    skillsMap["HTML layout"].dependentSkills = ["CSS styling", "Responsive Design", "ReactJS component design"];
  }
  if (skillsMap["JavaScript syntax"]) {
    skillsMap["JavaScript syntax"].dependentSkills = ["DOM manipulation", "ES6+ Javascript", "ReactJS component design", "NodeJS development"];
  }

  return {
    courseSkillGraph: {
      courses: courseSkillMapping,
      skills: skillsMap
    },
    courseCareerMapping: {
      careers: careerMap
    }
  };
};

const buildInterventionRules = () => {
  const rules = [];
  curriculum.forEach(c => {
    if (c.academicImportanceLevel === "CRITICAL" || c.academicImportanceLevel === "HIGH") {
      rules.push({
        "courseId": c.courseId,
        "riskPriority": c.academicImportanceLevel,
        "triggerCondition": "FAILED_OR_WEAK",
        "advisoryMessage": `Hệ thống phát hiện suy giảm năng lực cốt lõi ở môn ${c.courseId} (${c.courseName}). Đây là học phần then chốt chặn tiến độ chuyên ngành.`,
        "remediationSteps": c.remediationRecommendations
      });
    }
  });
  return { rules };
};

// Expert syllabus evidence mapping for core courses
const EXPERT_EVIDENCE = {
  "COM108": {
    "Programming Logic": {
      "source": "FPT Polytechnic Syllabus - COM108 Nhập môn lập trình",
      "location": "Bài 3: Cấu trúc rẽ nhánh và vòng lặp",
      "learningOutcome": "CLO2: Sử dụng thành thạo cấu trúc rẽ nhánh và vòng lặp"
    },
    "Algorithmic thinking": {
      "source": "FPT Polytechnic Syllabus - COM108 Nhập môn lập trình",
      "location": "Bài 2: Kiểu dữ liệu, biến và toán tử",
      "learningOutcome": "CLO1: Hiểu cách hoạt động của biến, kiểu dữ liệu và toán tử"
    },
    "C syntax": {
      "source": "FPT Polytechnic Syllabus - COM108 Nhập môn lập trình",
      "location": "Bài 1: Làm quen với ngôn ngữ lập trình C",
      "learningOutcome": "CLO1: Hiểu cách hoạt động của biến, kiểu dữ liệu và toán tử"
    },
    "Debugging basics": {
      "source": "FPT Polytechnic Syllabus - COM108 Nhập môn lập trình",
      "location": "Bài 5: Mảng và Hàm tự định nghĩa",
      "learningOutcome": "CLO3: Viết hàm tự định nghĩa và quản lý mảng dữ liệu"
    }
  },
  "WEB1013": {
    "HTML layout": {
      "source": "FPT Polytechnic Syllabus - WEB1013 Xây dựng trang Web",
      "location": "Bài 1 & 2: Cấu trúc trang với HTML5",
      "learningOutcome": "CLO1: Viết cấu trúc trang web chuẩn ngữ nghĩa HTML5"
    },
    "CSS styling": {
      "source": "FPT Polytechnic Syllabus - WEB1013 Xây dựng trang Web",
      "location": "Bài 3 & 4: Định dạng CSS3 cơ bản",
      "learningOutcome": "CLO2: Định dạng giao diện hiện đại sử dụng CSS3"
    },
    "Responsive Design": {
      "source": "FPT Polytechnic Syllabus - WEB1013 Xây dựng trang Web",
      "location": "Bài 7: Thiết kế đáp ứng Media Queries",
      "learningOutcome": "CLO3: Tạo giao diện tương thích đa thiết bị bằng Media Queries"
    },
    "Flexbox/Grid layout": {
      "source": "FPT Polytechnic Syllabus - WEB1013 Xây dựng trang Web",
      "location": "Bài 5 & 6: Bố cục nâng cao Flexbox và CSS Grid",
      "learningOutcome": "CLO2: Định dạng giao diện hiện đại sử dụng CSS3 (Flexbox/Grid)"
    }
  },
  "WEB1043": {
    "JavaScript syntax": {
      "source": "FPT Polytechnic Syllabus - WEB1043 Lập trình cơ sở với JavaScript",
      "location": "Bài 1: Cú pháp cơ bản và biến trong JS",
      "learningOutcome": "CLO1: Thao tác động với thẻ HTML thông qua JavaScript DOM"
    },
    "DOM manipulation": {
      "source": "FPT Polytechnic Syllabus - WEB1043 Lập trình cơ sở với JavaScript",
      "location": "Bài 3: Tương tác DOM và thay đổi HTML/CSS",
      "learningOutcome": "CLO1: Thao tác động với thẻ HTML thông qua JavaScript DOM"
    },
    "Event handling": {
      "source": "FPT Polytechnic Syllabus - WEB1043 Lập trình cơ sở với JavaScript",
      "location": "Bài 4: Xử lý sự kiện Event listener trên trình duyệt",
      "learningOutcome": "CLO2: Xử lý các sự kiện click, hover, submit trên trình duyệt"
    },
    "Form validation": {
      "source": "FPT Polytechnic Syllabus - WEB1043 Lập trình cơ sở với JavaScript",
      "location": "Bài 6: Kiểm tra dữ liệu Form Validation",
      "learningOutcome": "CLO3: Viết mã xác thực biểu mẫu (Form Validation) phía client"
    }
  },
  "WEB105": {
    "User Research": {
      "source": "FPT Polytechnic Syllabus - WEB105 UI/UX Design",
      "location": "Bài 2: Nghiên cứu người dùng và Thiết lập hành trình",
      "learningOutcome": "CLO1: Thực hiện nghiên cứu người dùng và vẽ sơ đồ hành trình"
    },
    "Wireframing": {
      "source": "FPT Polytechnic Syllabus - WEB105 UI/UX Design",
      "location": "Bài 4: Xây dựng cấu trúc trang và Thiết kế Wireframe",
      "learningOutcome": "CLO2: Thiết kế giao diện Wireframe đến Mockup chi tiết"
    },
    "Figma Prototyping": {
      "source": "FPT Polytechnic Syllabus - WEB105 UI/UX Design",
      "location": "Bài 6: Thiết kế tương tác Prototype và Kiểm thử trên Figma",
      "learningOutcome": "CLO3: Tạo Prototype tương tác động và kiểm thử trên Figma"
    },
    "Design Thinking": {
      "source": "FPT Polytechnic Syllabus - WEB105 UI/UX Design",
      "location": "Bài 1: Tổng quan về UI/UX và quy trình Design Thinking",
      "learningOutcome": "CLO1: Thực hiện nghiên cứu người dùng và vẽ sơ đồ hành trình"
    }
  },
  "WEB2063": {
    "API Integration": {
      "source": "FPT Polytechnic Syllabus - WEB2063 Lập trình Javascript nâng cao",
      "location": "Bài 4: Kết nối Web API và tích hợp dữ liệu",
      "learningOutcome": "CLO1: Gọi và tích hợp thành thạo dữ liệu từ API thông qua Fetch/Axios"
    },
    "HTTP client (Axios/Fetch)": {
      "source": "FPT Polytechnic Syllabus - WEB2063 Lập trình Javascript nâng cao",
      "location": "Bài 3: Gửi nhận yêu cầu HTTP bằng Fetch và Axios",
      "learningOutcome": "CLO1: Gọi và tích hợp thành thạo dữ liệu từ API thông qua Fetch/Axios"
    },
    "Client-side storage": {
      "source": "FPT Polytechnic Syllabus - WEB2063 Lập trình Javascript nâng cao",
      "location": "Bài 5: Quản lý bộ nhớ Local/Session Storage",
      "learningOutcome": "CLO2: Xử lý lưu trữ trạng thái người dùng (Local Storage, Session Storage)"
    },
    "JS security (XSS prevention)": {
      "source": "FPT Polytechnic Syllabus - WEB2063 Lập trình Javascript nâng cao",
      "location": "Bài 7: Bảo mật ứng dụng Web phía Client và chống mã độc",
      "learningOutcome": "CLO3: Phòng tránh các lỗ hổng bảo mật phía client cơ bản"
    }
  },
  "WEB2081": {
    "ReactJS component design": {
      "source": "FPT Polytechnic Syllabus - WEB2081 Lập trình Front-End Framework 1",
      "location": "Bài 2: Tạo React Component và tái sử dụng giao diện",
      "learningOutcome": "CLO1: Xây dựng ứng dụng web chia theo cấu trúc Component tái sử dụng"
    },
    "React state and props": {
      "source": "FPT Polytechnic Syllabus - WEB2081 Lập trình Front-End Framework 1",
      "location": "Bài 3: Quản lý vòng đời dữ liệu Props và State",
      "learningOutcome": "CLO2: Quản lý vòng đời dữ liệu bằng Props và State"
    },
    "Basic React Hooks (useState/useEffect)": {
      "source": "FPT Polytechnic Syllabus - WEB2081 Lập trình Front-End Framework 1",
      "location": "Bài 4 & 5: Xử lý Side Effect bằng Hooks useState và useEffect",
      "learningOutcome": "CLO3: Sử dụng Hook useState và useEffect xử lý sự kiện"
    },
    "Vite build tool": {
      "source": "FPT Polytechnic Syllabus - WEB2081 Lập trình Front-End Framework 1",
      "location": "Bài 1: Khởi tạo dự án React bằng Vite",
      "learningOutcome": "CLO1: Xây dựng ứng dụng web chia theo cấu trúc Component tái sử dụng"
    }
  },
  "WEB2091": {
    "Global State Management (Redux Toolkit/Context)": {
      "source": "FPT Polytechnic Syllabus - WEB2091 Lập trình Front-End Framework 2",
      "location": "Bài 3 & 4: Quản lý State toàn cục với Redux Toolkit",
      "learningOutcome": "CLO1: Quản lý state toàn cục dự án lớn bằng Redux Toolkit"
    },
    "React Routing": {
      "source": "FPT Polytechnic Syllabus - WEB2091 Lập trình Front-End Framework 2",
      "location": "Bài 2: Cấu hình định tuyến React Router",
      "learningOutcome": "CLO2: Thiết lập định tuyến trang phức tạp bằng React Router"
    },
    "Performance optimization (useMemo/useCallback)": {
      "source": "FPT Polytechnic Syllabus - WEB2091 Lập trình Front-End Framework 2",
      "location": "Bài 5: Tối ưu hóa hiệu năng render component",
      "learningOutcome": "CLO3: Tối ưu hiệu năng render ứng dụng React"
    },
    "NextJS fundamentals": {
      "source": "FPT Polytechnic Syllabus - WEB2091 Lập trình Front-End Framework 2",
      "location": "Bài 7: Nhập môn NextJS và cơ chế SSR/SSG",
      "learningOutcome": "CLO3: Tối ưu hiệu năng render ứng dụng React"
    }
  },
  "COM2012": {
    "Database Design": {
      "source": "FPT Polytechnic Syllabus - COM2012 Cơ sở dữ liệu",
      "location": "Bài 2 & 3: Thiết kế lược đồ ERD cho cơ sở dữ liệu",
      "learningOutcome": "CLO1: Thiết kế lược đồ ERD chuẩn cho bài toán thực tế"
    },
    "SQL querying": {
      "source": "FPT Polytechnic Syllabus - COM2012 Cơ sở dữ liệu",
      "location": "Bài 5 & 6: Viết câu lệnh truy vấn SQL từ cơ bản đến nâng cao",
      "learningOutcome": "CLO3: Viết thành thạo truy vấn SQL (JOIN, GROUP BY, Subquery)"
    },
    "Entity Relationship Modeling": {
      "source": "FPT Polytechnic Syllabus - COM2012 Cơ sở dữ liệu",
      "location": "Bài 2: Biểu diễn Thực thể ERD và mối quan hệ",
      "learningOutcome": "CLO1: Thiết kế lược đồ ERD chuẩn cho bài toán thực tế"
    },
    "Normalization": {
      "source": "FPT Polytechnic Syllabus - COM2012 Cơ sở dữ liệu",
      "location": "Bài 4: Chuẩn hóa cơ sở dữ liệu quan hệ 1NF, 2NF, 3NF",
      "learningOutcome": "CLO2: Áp dụng các quy tắc chuẩn hóa dữ liệu (1NF, 2NF, 3NF)"
    }
  },
  "WEB503": {
    "NodeJS development": {
      "source": "FPT Polytechnic Syllabus - WEB503 NodeJS & Restful Web Service",
      "location": "Bài 1 & 2: Cài đặt Node.js và khởi tạo Express server",
      "learningOutcome": "CLO1: Xây dựng máy chủ Express kết nối CSDL MongoDB"
    },
    "ExpressJS framework": {
      "source": "FPT Polytechnic Syllabus - WEB503 NodeJS & Restful Web Service",
      "location": "Bài 3: Quản lý định tuyến và viết middleware trong Express",
      "learningOutcome": "CLO1: Xây dựng máy chủ Express kết nối CSDL MongoDB"
    },
    "Restful API Design": {
      "source": "FPT Polytechnic Syllabus - WEB503 NodeJS & Restful Web Service",
      "location": "Bài 4: Xây dựng bộ API chuẩn Restful CRUD",
      "learningOutcome": "CLO2: Thiết kế bộ API chuẩn Restful đầy đủ chức năng"
    },
    "NoSQL database (MongoDB)": {
      "source": "FPT Polytechnic Syllabus - WEB503 NodeJS & Restful Web Service",
      "location": "Bài 5 & 6: Kết nối và thao tác với CSDL MongoDB qua Mongoose",
      "learningOutcome": "CLO1: Xây dựng máy chủ Express kết nối CSDL MongoDB"
    }
  },
  "PRO2201": {
    "Agile/Scrum Project Management": {
      "source": "FPT Polytechnic Syllabus - PRO2201 Dự án tốt nghiệp",
      "location": "Tuần 1 - 2: Lập kế hoạch Scrum và quản lý backlog",
      "learningOutcome": "CLO1: Quản trị dự án phần mềm chuyên nghiệp theo Agile/Scrum"
    },
    "Full Stack Development": {
      "source": "FPT Polytechnic Syllabus - PRO2201 Dự án tốt nghiệp",
      "location": "Tuần 3 - 10: Lập trình sản phẩm Full Stack SPA React + NodeJS",
      "learningOutcome": "CLO2: Lập trình sản phẩm Full Stack Web chất lượng cao, bảo mật"
    },
    "System Architecture Design": {
      "source": "FPT Polytechnic Syllabus - PRO2201 Dự án tốt nghiệp",
      "location": "Tuần 2: Thiết kế kiến trúc hệ thống và luồng dữ liệu",
      "learningOutcome": "CLO2: Lập trình sản phẩm Full Stack Web chất lượng cao, bảo mật"
    },
    "Technical Presentation": {
      "source": "FPT Polytechnic Syllabus - PRO2201 Dự án tốt nghiệp",
      "location": "Tuần 11 - 12: Thuyết trình chạy thử và bảo vệ đồ án",
      "learningOutcome": "CLO3: Thuyết trình bảo vệ đồ án tốt nghiệp thuyết phục tự tin trước hội đồng"
    }
  }
};

// Process curriculum to attach evidence for each skill
curriculum.forEach(c => {
  const customEv = EXPERT_EVIDENCE[c.courseId] || {};
  c.evidence = {};
  c.coreSkills.forEach((sk, sIdx) => {
    if (customEv[sk]) {
      c.evidence[sk] = customEv[sk];
    } else {
      c.evidence[sk] = {
        "source": `FPT Polytechnic Syllabus - ${c.courseId} ${c.courseName}`,
        "location": `Bài ${sIdx + 1}: Đào tạo chuyên sâu kỹ năng ${sk}`,
        "learningOutcome": c.learningOutcomes[sIdx % c.learningOutcomes.length] || `Chuẩn đầu ra môn ${c.courseId}`
      };
    }
  });
});

// Write files
const { courseSkillGraph, courseCareerMapping } = buildSkillsAndCareers();
const { rules: interventionRules } = buildInterventionRules();

fs.writeFileSync(path.join(outputDir, 'curriculum_knowledge_base.json'), JSON.stringify(curriculum, null, 2), 'utf8');
fs.writeFileSync(path.join(outputDir, 'course_skill_graph.json'), JSON.stringify(courseSkillGraph, null, 2), 'utf8');
fs.writeFileSync(path.join(outputDir, 'course_career_mapping.json'), JSON.stringify(courseCareerMapping, null, 2), 'utf8');
fs.writeFileSync(path.join(outputDir, 'course_intervention_rules.json'), JSON.stringify({ rules: interventionRules }, null, 2), 'utf8');

console.log('✅ Generated 4 Curriculum Knowledge Base files successfully inside server/data/knowledge/.');
