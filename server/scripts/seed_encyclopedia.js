const fs = require('fs');
const path = require('path');

const encyclopedia = {
  "Node.js": {
    "skill": "Node.js",
    "definition": "Node.js là một môi trường runtime mã nguồn mở, đa nền tảng, cho phép thực thi mã JavaScript bên ngoài trình duyệt web.",
    "whyLearn": "Cho phép lập trình viên sử dụng JavaScript để viết cả Frontend lẫn Backend, tiết kiệm thời gian học ngôn ngữ mới, phù hợp với kiến trúc microservices và I/O bất đồng bộ.",
    "usedIn": ["Backend Developer", "Full Stack Developer", "Node.js Developer", "Software Engineer"],
    "prerequisites": ["JavaScript", "Asynchronous Programming", "HTTP/REST"],
    "relatedCourses": ["WEB206", "PRO1014"],
    "difficulty": "Intermediate",
    "learningTime": "4-6 weeks",
    "resources": ["Tài liệu chính thức Node.js", "Khóa học Udemy Node.js Bootcamp"],
    "roadmap": {
      "week1": "Cơ bản về Node.js, V8 Engine, Modules, NPM, Event Loop",
      "week2": "Express.js cơ bản, Xây dựng REST API, Middleware",
      "week3": "Kết nối Database (MongoDB/PostgreSQL), Xác thực JWT",
      "week4": "Kiến trúc ứng dụng, Xử lý lỗi, Triển khai (Deployment)"
    },
    "projects": ["Todo API", "Blog REST API", "Chat App với Socket.io", "Hệ thống quản lý sinh viên"]
  },
  "React": {
    "skill": "React",
    "definition": "React là một thư viện JavaScript dùng để xây dựng giao diện người dùng (UI), được phát triển bởi Facebook.",
    "whyLearn": "React là công nghệ Frontend phổ biến nhất hiện nay, giúp xây dựng ứng dụng Single Page Application (SPA) với hiệu suất cao thông qua Virtual DOM và mô hình Component.",
    "usedIn": ["Frontend Developer", "Full Stack Developer", "React Developer", "UI Engineer"],
    "prerequisites": ["HTML", "CSS", "JavaScript", "ES6+"],
    "relatedCourses": ["WEB207", "PRO116"],
    "difficulty": "Intermediate",
    "learningTime": "6-8 weeks",
    "resources": ["React.dev", "Khóa học Frontend Masters"],
    "roadmap": {
      "week1": "Cơ bản về JSX, Components, Props",
      "week2": "State Management, Lifecycle, Hooks (useState, useEffect)",
      "week3": "Routing với React Router, API Fetching",
      "week4": "Quản lý State nâng cao (Redux/Zustand), Performance Optimization"
    },
    "projects": ["Ứng dụng Quản lý công việc (Todo App)", "Trang web E-commerce UI", "Ứng dụng Thời tiết"]
  },
  "SQL": {
    "skill": "SQL",
    "definition": "SQL (Structured Query Language) là ngôn ngữ chuẩn dùng để quản lý và thao tác với các cơ sở dữ liệu quan hệ (RDBMS).",
    "whyLearn": "SQL là nền tảng cốt lõi của Backend, Data Engineering và Data Analytics. Bất kỳ ứng dụng nào cũng cần lưu trữ dữ liệu có cấu trúc.",
    "usedIn": ["Backend Developer", "Full Stack Developer", "Database Administrator", "QA Automation Engineer"],
    "prerequisites": ["Database Fundamentals"],
    "relatedCourses": ["COM2034", "SOF203"],
    "difficulty": "Beginner to Intermediate",
    "learningTime": "3-5 weeks",
    "resources": ["W3Schools SQL", "SQLZoo"],
    "roadmap": {
      "week1": "Khái niệm Database, Bảng, Các câu lệnh CRUD cơ bản (SELECT, INSERT, UPDATE, DELETE)",
      "week2": "Filtering, Sorting, Functions (COUNT, SUM, AVG), GROUP BY",
      "week3": "JOIN (INNER, LEFT, RIGHT), Subqueries, Ràng buộc dữ liệu",
      "week4": "Index, View, Stored Procedures, Transaction"
    },
    "projects": ["Hệ thống quản lý Thư viện (Lược đồ DB)", "Hệ thống Cửa hàng bán lẻ (SQL Scripts)"]
  },
  "Express.js": {
    "skill": "Express.js",
    "definition": "Express.js là một framework web tối giản và linh hoạt dành cho Node.js, cung cấp bộ tính năng mạnh mẽ cho web và ứng dụng di động.",
    "whyLearn": "Đây là tiêu chuẩn công nghiệp (de-facto standard) để xây dựng Web APIs bằng Node.js, với cộng đồng hỗ trợ lớn và vô số middleware.",
    "usedIn": ["Backend Developer", "Full Stack Developer"],
    "prerequisites": ["Node.js", "HTTP/REST", "JavaScript"],
    "relatedCourses": ["WEB206"],
    "difficulty": "Beginner to Intermediate",
    "learningTime": "2-3 weeks",
    "resources": ["Express.js Documentation"],
    "roadmap": {
      "week1": "Cài đặt Express, Routing cơ bản, Xử lý Request/Response",
      "week2": "Middleware, Template Engines (Tùy chọn), Error Handling",
      "week3": "Tích hợp Database, Xây dựng RESTful API chuẩn",
      "week4": "Xác thực & Bảo mật (CORS, Helmet, JWT)"
    },
    "projects": ["REST API Quản lý sản phẩm", "API Đăng nhập/Đăng ký"]
  },
  "Next.js": {
    "skill": "Next.js",
    "definition": "Next.js là một React framework hỗ trợ Server-Side Rendering (SSR) và Static Site Generation (SSG), giúp xây dựng web cực nhanh và chuẩn SEO.",
    "whyLearn": "Giải quyết bài toán SEO và hiệu suất tải trang đầu tiên của React truyền thống, được nhiều công ty lớn tin dùng.",
    "usedIn": ["Frontend Developer", "Next.js Developer", "Full Stack Developer"],
    "prerequisites": ["React", "JavaScript", "TypeScript (Tùy chọn)"],
    "relatedCourses": ["WEB207", "PRO116"],
    "difficulty": "Advanced",
    "learningTime": "4-6 weeks",
    "resources": ["Next.js Learn", "Vercel Docs"],
    "roadmap": {
      "week1": "App Router vs Pages Router, Routing cơ bản",
      "week2": "Data Fetching (SSR, SSG, ISR), Server Components",
      "week3": "API Routes, Middleware, NextAuth",
      "week4": "Tối ưu hóa hình ảnh/font, Triển khai lên Vercel"
    },
    "projects": ["Blog cá nhân tĩnh (SSG)", "Trang thương mại điện tử (SSR)", "Hệ thống Quản trị"]
  }
};

const dependencyGraph = {
  "Node.js": ["JavaScript", "Asynchronous Programming", "HTTP/REST"],
  "React": ["HTML", "CSS", "JavaScript", "ES6+"],
  "SQL": ["Database Fundamentals"],
  "Express.js": ["Node.js", "HTTP/REST", "JavaScript"],
  "Next.js": ["React", "JavaScript"]
};

const outDir = path.join(process.cwd(), 'server', 'data', 'knowledge');
fs.writeFileSync(path.join(outDir, 'skill_encyclopedia.json'), JSON.stringify(encyclopedia, null, 2));
fs.writeFileSync(path.join(outDir, 'skill_dependency_graph.json'), JSON.stringify(dependencyGraph, null, 2));

console.log("Successfully seeded skill_encyclopedia.json and skill_dependency_graph.json");
