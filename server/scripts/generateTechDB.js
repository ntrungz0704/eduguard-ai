const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'server', 'data', 'knowledge', 'technologies.json');
const existingTechs = require(dataPath);

const newTechs = [
  {
    id: "css",
    name: "CSS",
    aliases: ["css", "css3", "tailwind", "sass"],
    definition: "CSS (Cascading Style Sheets) là ngôn ngữ dùng để mô tả cách trình bày các tài liệu viết bằng HTML. CSS giúp định dạng màu sắc, bố cục, font chữ và tạo hiệu ứng đồ họa.",
    whyLearn: "Nếu HTML là bộ xương, thì CSS là làn da và quần áo của trang web. Bất kỳ công việc Frontend nào cũng yêu cầu kỹ năng CSS xuất sắc để tạo giao diện đẹp và Responsive.",
    relatedCourses: ["WEB1013", "WEB1043"],
    prerequisites: ["HTML cơ bản"],
    prerequisiteCourses: [],
    roadmap30Days: [
      "Tuần 1: Cú pháp cơ bản, Selectors, Màu sắc, Font chữ và Box Model.",
      "Tuần 2: Bố cục trang web với Flexbox và CSS Grid.",
      "Tuần 3: Responsive Design (Media Queries), Mobile-first.",
      "Tuần 4: CSS Animations, Transitions, Variables và làm quen Tailwind CSS."
    ]
  },
  {
    id: "typescript",
    name: "TypeScript",
    aliases: ["ts", "typescript"],
    definition: "TypeScript là một ngôn ngữ lập trình mã nguồn mở được phát triển bởi Microsoft, là một phiên bản siêu tập hợp (superset) của JavaScript có hỗ trợ khai báo kiểu tĩnh (static typing).",
    whyLearn: "Các dự án lớn (Enterprise) đều dùng TypeScript để giảm thiểu lỗi runtime và dễ bảo trì. Biết TypeScript giúp bạn vượt trội hơn hẳn so với ứng viên chỉ biết JavaScript thuần.",
    relatedCourses: ["WEB2091"],
    prerequisites: ["JavaScript ES6+", "OOP cơ bản"],
    prerequisiteCourses: ["WEB1043", "WEB2063"],
    roadmap30Days: [
      "Tuần 1: Khai báo kiểu cơ bản (Basic Types), Type Inference, Interfaces.",
      "Tuần 2: Union & Intersection Types, Enums, Type Assertions, Functions.",
      "Tuần 3: Classes, OOP trong TypeScript, Generics.",
      "Tuần 4: Cấu hình tsconfig.json, kết hợp TypeScript với React (TSX) hoặc Node.js."
    ]
  },
  {
    id: "git",
    name: "Git & GitHub",
    aliases: ["git", "github", "gitlab", "bitbucket", "version control"],
    definition: "Git là hệ thống quản lý phiên bản phân tán, giúp theo dõi các thay đổi trong mã nguồn. GitHub là nền tảng đám mây để lưu trữ và cộng tác dựa trên Git.",
    whyLearn: "Đây là kỹ năng sinh tồn. Không một công ty phần mềm nào hiện nay không dùng Git. Nó giúp bạn làm việc nhóm, khôi phục code khi lỗi và xây dựng Portfolio.",
    relatedCourses: ["COM108"],
    prerequisites: ["Tin học cơ bản", "Biết dùng Command Line cơ bản"],
    prerequisiteCourses: [],
    roadmap30Days: [
      "Tuần 1: Cài đặt Git, khái niệm Working Directory, Staging Area, Local Repository.",
      "Tuần 2: Các lệnh cơ bản: init, add, commit, status, log. Kết nối GitHub (push, pull).",
      "Tuần 3: Quản lý nhánh (Branching): branch, checkout, merge, giải quyết Conflict.",
      "Tuần 4: Làm việc nhóm: Pull Request (PR), Fork, Git Flow và viết README.md chuyên nghiệp."
    ]
  },
  {
    id: "docker",
    name: "Docker",
    aliases: ["docker", "container", "docker-compose"],
    definition: "Docker là một nền tảng mã nguồn mở giúp tự động hóa việc triển khai ứng dụng bên trong các container phần mềm nhẹ, di động và tự cung cấp môi trường.",
    whyLearn: "Giải quyết triệt để vấn đề 'code chạy trên máy tôi nhưng lỗi trên server'. Cần thiết cho Backend, DevOps và kiến trúc Microservices.",
    relatedCourses: ["SYB301"],
    prerequisites: ["Kiến thức hệ điều hành (Linux)", "Mạng máy tính cơ bản"],
    prerequisiteCourses: [],
    roadmap30Days: [
      "Tuần 1: Khái niệm Virtualization vs Containerization. Cài đặt Docker Desktop.",
      "Tuần 2: Docker Images, Docker Hub, viết Dockerfile và build Image cho ứng dụng Node/React.",
      "Tuần 3: Docker Containers (run, stop, rm, logs, exec), Volumes và Mạng (Networking).",
      "Tuần 4: Quản lý multi-container với Docker Compose."
    ]
  },
  {
    id: "restapi",
    name: "REST API",
    aliases: ["api", "rest api", "restful", "rest"],
    definition: "REST API là một tiêu chuẩn kiến trúc phần mềm dùng để thiết kế các dịch vụ web kết nối giữa Client (Frontend/Mobile) và Server (Backend).",
    whyLearn: "Là cách thức giao tiếp chính của các hệ thống phần mềm hiện đại. Dù bạn làm Frontend (gọi API) hay Backend (viết API), bạn đều phải hiểu tường tận REST.",
    relatedCourses: ["WEB502", "WEB503"],
    prerequisites: ["Giao thức HTTP", "Cơ bản về Backend (Node/Java/PHP)"],
    prerequisiteCourses: ["WEB1043"],
    roadmap30Days: [
      "Tuần 1: Giao thức HTTP (Methods: GET, POST, PUT, DELETE), Status Codes, Headers.",
      "Tuần 2: Thiết kế URI/URL chuẩn RESTful, JSON format. Sử dụng Postman để test API.",
      "Tuần 3: Viết API với Express.js, nhận dữ liệu qua req.params, req.query, req.body.",
      "Tuần 4: Xử lý lỗi (Error Handling), Pagination, Filtering, Sorting và API Documentation (Swagger)."
    ]
  },
  {
    id: "sql",
    name: "SQL & RDBMS",
    aliases: ["sql", "mysql", "postgresql", "rdbms", "database"],
    definition: "SQL (Structured Query Language) là ngôn ngữ chuẩn để tương tác với Cơ sở dữ liệu quan hệ (RDBMS) như MySQL, PostgreSQL, SQL Server.",
    whyLearn: "90% các hệ thống phần mềm cốt lõi (Ngân hàng, ERP, CRM) đều dùng CSDL quan hệ. Kỹ năng SQL vững chắc giúp bạn tối ưu hệ thống Backend cực tốt.",
    relatedCourses: ["WEB502"],
    prerequisites: ["Tư duy logic", "Kiến thức về lưu trữ dữ liệu"],
    prerequisiteCourses: ["COM108"],
    roadmap30Days: [
      "Tuần 1: Thiết kế CSDL (Tables, Columns, Data Types), Primary Key, Foreign Key.",
      "Tuần 2: Các câu lệnh CRUD (INSERT, SELECT, UPDATE, DELETE) và WHERE, LIKE, IN.",
      "Tuần 3: Joins (INNER, LEFT, RIGHT), GROUP BY, HAVING và Aggregate Functions (COUNT, SUM).",
      "Tuần 4: Indexes, Transactions (ACID), Subqueries và chuẩn hóa CSDL (Normalization)."
    ]
  },
  {
    id: "aws",
    name: "AWS Cloud",
    aliases: ["aws", "cloud", "amazon web services", "ec2", "s3"],
    definition: "AWS (Amazon Web Services) là nền tảng điện toán đám mây toàn diện và được sử dụng rộng rãi nhất thế giới, cung cấp hơn 200 dịch vụ từ các trung tâm dữ liệu toàn cầu.",
    whyLearn: "Chuyển dịch lên Cloud là xu hướng tất yếu. Sở hữu kỹ năng AWS (hoặc Azure/GCP) giúp bạn vươn lên thành Cloud Engineer hoặc DevOps với mức lương rất cao.",
    relatedCourses: [],
    prerequisites: ["Mạng máy tính (Networking)", "Linux CLI", "Kiến trúc hệ thống"],
    prerequisiteCourses: [],
    roadmap30Days: [
      "Tuần 1: Khái niệm Cloud Computing (IaaS, PaaS, SaaS), IAM (Quản lý quyền truy cập).",
      "Tuần 2: Dịch vụ tính toán (EC2), kết nối SSH, Security Groups, Elastic IP.",
      "Tuần 3: Dịch vụ lưu trữ (S3) để chứa ảnh tĩnh/Frontend, RDS (Database managed).",
      "Tuần 4: VPC (Networking cơ bản), Route53, Load Balancing (ELB) và Auto Scaling."
    ]
  },
  {
    id: "reactnative",
    name: "React Native",
    aliases: ["react native", "reactnative", "rn"],
    definition: "React Native là một framework mã nguồn mở do Meta tạo ra, cho phép bạn xây dựng ứng dụng di động gốc (Native Mobile Apps) cho iOS và Android sử dụng JavaScript và React.",
    whyLearn: "Tiết kiệm chi phí và thời gian phát triển app. Nếu bạn đã biết React web, bạn có thể học React Native rất nhanh để trở thành Mobile Developer.",
    relatedCourses: ["MOB402", "MOB403"],
    prerequisites: ["Sử dụng thành thạo React (Hooks, Components)", "JavaScript ES6+"],
    prerequisiteCourses: ["WEB2091"],
    roadmap30Days: [
      "Tuần 1: Khái niệm Core Components (View, Text, Image, ScrollView, TextInput), Flexbox.",
      "Tuần 2: Cài đặt môi trường (Expo CLI vs React Native CLI), Navigation (React Navigation).",
      "Tuần 3: Quản lý State, FlatList, SectionList, Tương tác hệ thống (Camera, Location).",
      "Tuần 4: Tích hợp API (Axios), Push Notifications và Build/Publish app lên Store."
    ]
  },
  {
    id: "flutter",
    name: "Flutter",
    aliases: ["flutter", "dart", "flutter framework"],
    definition: "Flutter là UI toolkit của Google để xây dựng các ứng dụng biên dịch gốc (natively compiled) cho thiết bị di động, web và desktop từ một codebase duy nhất sử dụng ngôn ngữ Dart.",
    whyLearn: "Flutter mang lại hiệu năng cao (bản chất compile ra mã gốc) và trải nghiệm UI/UX cực kỳ mượt mà, đang là lựa chọn số 1 cho các startup làm Mobile App.",
    relatedCourses: ["MOB401", "MOB402"],
    prerequisites: ["Tư duy lập trình OOP (Java/C++/Dart)"],
    prerequisiteCourses: ["COM108"],
    roadmap30Days: [
      "Tuần 1: Cú pháp Dart cơ bản, khái niệm Widget (Mọi thứ đều là Widget), Stateless vs Stateful.",
      "Tuần 2: Bố cục UI (Row, Column, Stack, Container), Material Design và Cupertino.",
      "Tuần 3: Navigation, gọi REST API (http package), Xử lý JSON.",
      "Tuần 4: State Management (Provider hoặc Riverpod), Lưu trữ cục bộ (Shared Preferences) và Build app."
    ]
  },
  {
    id: "linux",
    name: "Linux CLI",
    aliases: ["linux", "bash", "terminal", "ubuntu", "centos", "cli"],
    definition: "Linux CLI là giao diện dòng lệnh của hệ điều hành Linux, nơi bạn tương tác với máy tính bằng các lệnh văn bản thay vì giao diện đồ họa (GUI).",
    whyLearn: "Hầu hết các server chạy web đều dùng Linux (Ubuntu/CentOS). Biết Linux CLI là bắt buộc để bạn có thể tự deploy code (Backend, Frontend) lên VPS.",
    relatedCourses: ["SYB301"],
    prerequisites: ["Tin học cơ bản"],
    prerequisiteCourses: [],
    roadmap30Days: [
      "Tuần 1: Cấu trúc thư mục Linux, các lệnh di chuyển và thao tác file (cd, ls, mkdir, rm, cp, mv).",
      "Tuần 2: Xem và chỉnh sửa nội dung file (cat, less, grep, nano, vim).",
      "Tuần 3: Quản lý user, phân quyền (chmod, chown), quản lý tiến trình (ps, kill, top).",
      "Tuần 4: Cài đặt phần mềm (apt/yum), cấu hình mạng cơ bản, SSH vào remote server."
    ]
  }
];

// Merge
const map = new Map();
existingTechs.forEach(t => map.set(t.id, t));
newTechs.forEach(t => map.set(t.id, t));

const merged = Array.from(map.values());
fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2));
console.log(`Successfully generated technologies.json with ${merged.length} items.`);
