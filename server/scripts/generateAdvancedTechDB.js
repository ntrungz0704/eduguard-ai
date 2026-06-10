const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'server', 'data', 'knowledge', 'technologies.json');
const existingTechs = require(dataPath);

const advancedTechs = [
  {
    id: "expressjs",
    name: "Express.js",
    aliases: ["express", "expressjs", "express.js"],
    definition: "Express.js là một framework web tối giản và linh hoạt dành cho Node.js, cung cấp một tập hợp các tính năng mạnh mẽ để xây dựng ứng dụng web và mobile.",
    whyLearn: "Đây là tiêu chuẩn công nghiệp (de facto standard) cho việc xây dựng RESTful APIs trong hệ sinh thái Node.js. Hầu hết các công việc Backend Node.js đều yêu cầu.",
    relatedCourses: ["WEB503"],
    prerequisites: ["Node.js", "REST API cơ bản"],
    prerequisiteCourses: ["WEB502"],
    roadmap30Days: [
      "Tuần 1: Cài đặt, Routing cơ bản, req và res.",
      "Tuần 2: Middleware (Custom, Error handling, 3rd party like cors/morgan).",
      "Tuần 3: Tích hợp Database (Mongoose, Sequelize), View Engines (EJS/Pug).",
      "Tuần 4: Bảo mật (Helmet, Rate Limiting), Xác thực (JWT/Passport.js)."
    ]
  },
  {
    id: "redux",
    name: "Redux & Zustand",
    aliases: ["redux", "zustand", "state management", "redux toolkit"],
    definition: "Redux và Zustand là các thư viện quản lý trạng thái (state management) toàn cục cho các ứng dụng JavaScript, phổ biến nhất là dùng kèm với React.",
    whyLearn: "Khi ứng dụng React lớn lên, việc truyền props (prop drilling) trở nên phức tạp. State Management là kỹ năng bắt buộc của Senior Frontend Developer.",
    relatedCourses: ["WEB2091"],
    prerequisites: ["React cơ bản", "Hooks (useState, useContext)"],
    prerequisiteCourses: ["WEB2081"],
    roadmap30Days: [
      "Tuần 1: Khái niệm Store, Actions, Reducers và Dispatch.",
      "Tuần 2: Sử dụng Redux Toolkit (configureStore, createSlice).",
      "Tuần 3: Xử lý bất đồng bộ (createAsyncThunk), RTK Query.",
      "Tuần 4: Chuyển đổi sang Zustand (nhẹ và hiện đại hơn) và tối ưu Re-renders."
    ]
  },
  {
    id: "nestjs",
    name: "NestJS",
    aliases: ["nest", "nestjs", "nest.js"],
    definition: "NestJS là một framework Node.js tiến tiến để xây dựng các ứng dụng server-side hiệu quả, có thể mở rộng, sử dụng kiến trúc OOP, FP và FRP với TypeScript.",
    whyLearn: "NestJS mang lại cấu trúc chặt chẽ (giống Angular/Spring Boot), rất được các tập đoàn lớn (Enterprise) ưa chuộng cho các hệ thống phức tạp và Microservices.",
    relatedCourses: [],
    prerequisites: ["TypeScript", "Express.js", "OOP/Decorators"],
    prerequisiteCourses: ["WEB503"],
    roadmap30Days: [
      "Tuần 1: Khái niệm Modules, Controllers, Providers và Dependency Injection.",
      "Tuần 2: Middleware, Exception Filters, Pipes (Validation), Guards (Auth).",
      "Tuần 3: Interceptors, tích hợp TypeORM/Prisma với Database.",
      "Tuần 4: Xây dựng GraphQL API, Microservices và Testing (Jest)."
    ]
  },
  {
    id: "kubernetes",
    name: "Kubernetes (K8s)",
    aliases: ["kubernetes", "k8s"],
    definition: "Kubernetes là một hệ thống mã nguồn mở để tự động hóa việc triển khai, mở rộng quy mô và quản lý các ứng dụng được container hóa (Docker).",
    whyLearn: "Đây là trái tim của hệ sinh thái DevOps và Cloud Native. Nắm vững K8s là chìa khóa để trở thành DevOps/Cloud Engineer cấp cao.",
    relatedCourses: [],
    prerequisites: ["Docker", "Linux CLI", "Networking"],
    prerequisiteCourses: ["SYB301"],
    roadmap30Days: [
      "Tuần 1: Kiến trúc K8s (Master/Worker nodes), Pods, Deployments.",
      "Tuần 2: Services, Ingress, Namespaces, ConfigMaps và Secrets.",
      "Tuần 3: Storage (Persistent Volumes, PVC), StatefulSets.",
      "Tuần 4: Helm charts, Monitoring (Prometheus/Grafana) và CI/CD với K8s."
    ]
  },
  {
    id: "cypress",
    name: "Cypress / Playwright",
    aliases: ["cypress", "playwright", "e2e testing", "automation test"],
    definition: "Cypress và Playwright là các công cụ kiểm thử tự động (Automation Testing) end-to-end cho các ứng dụng web hiện đại.",
    whyLearn: "Kiểm thử tự động giúp giảm thiểu lỗi khi deploy. Đây là kỹ năng cốt lõi của QA Automation Engineer và là một điểm cộng rất lớn cho lập trình viên.",
    relatedCourses: ["SOF304"],
    prerequisites: ["JavaScript", "HTML/CSS cơ bản", "Khái niệm Testing"],
    prerequisiteCourses: [],
    roadmap30Days: [
      "Tuần 1: Cài đặt Cypress/Playwright, viết Test Case E2E đầu tiên, Selectors.",
      "Tuần 2: Tương tác UI (Click, Type, Hover), Assertions (Chai/Expect).",
      "Tuần 3: Intercept Network/APIs, Mocking dữ liệu, Xử lý Authentication.",
      "Tuần 4: Tích hợp vào luồng CI/CD (GitHub Actions) và xuất Report (Allure)."
    ]
  },
  {
    id: "python",
    name: "Python",
    aliases: ["python", "python3", "py"],
    definition: "Python là ngôn ngữ lập trình bậc cao, đa năng, được biết đến với cú pháp cực kỳ dễ đọc. Python thống trị các lĩnh vực AI, Data Science và Backend.",
    whyLearn: "Dù bạn làm Web (Django/FastAPI) hay AI/Data, Python là công cụ không thể thiếu. Nó là ngôn ngữ phổ biến nhất thế giới hiện tại.",
    relatedCourses: ["PYF101", "PYF102"],
    prerequisites: ["Tin học cơ bản"],
    prerequisiteCourses: [],
    roadmap30Days: [
      "Tuần 1: Biến, Kiểu dữ liệu, Cấu trúc điều khiển (if, for, while).",
      "Tuần 2: Cấu trúc dữ liệu (List, Tuple, Dictionary, Set), Functions.",
      "Tuần 3: OOP (Classes, Inheritance), Xử lý File, Exception Handling.",
      "Tuần 4: Làm quen thư viện (Requests, Pandas cơ bản) hoặc Web API (FastAPI)."
    ]
  },
  {
    id: "langchain",
    name: "LangChain / LLM APIs",
    aliases: ["langchain", "llm", "openai api", "genai"],
    definition: "LangChain là một framework được thiết kế để đơn giản hóa việc tạo ra các ứng dụng sử dụng các mô hình ngôn ngữ lớn (LLMs) như OpenAI GPT-4.",
    whyLearn: "Trí tuệ nhân tạo tạo sinh (GenAI) đang bùng nổ. Biến LLM thành các ứng dụng thực tế (như Chatbot EduGuard) là kỹ năng nóng nhất của AI Engineer.",
    relatedCourses: [],
    prerequisites: ["Python hoặc JavaScript/Node.js", "REST APIs"],
    prerequisiteCourses: [],
    roadmap30Days: [
      "Tuần 1: Gọi OpenAI API, Khái niệm Prompts, Tokens, Chat Models.",
      "Tuần 2: Cài đặt LangChain, Prompts Templates, Output Parsers, Chains.",
      "Tuần 3: RAG (Retrieval-Augmented Generation), Vector Databases (Pinecone, Chroma).",
      "Tuần 4: Agents, Tools, Memory và xây dựng chatbot RAG hoàn chỉnh."
    ]
  },
  {
    id: "cicd",
    name: "CI/CD & GitHub Actions",
    aliases: ["ci/cd", "cicd", "github actions", "jenkins", "gitlab ci"],
    definition: "CI/CD (Continuous Integration / Continuous Deployment) là phương pháp tự động hóa quá trình tích hợp code, kiểm thử và triển khai ứng dụng lên server.",
    whyLearn: "Tăng tốc độ phát triển và giảm thiểu rủi ro khi release code. Kỹ năng bắt buộc để làm việc trong các đội ngũ Agile/DevOps chuyên nghiệp.",
    relatedCourses: [],
    prerequisites: ["Git & GitHub", "Linux CLI", "Docker cơ bản"],
    prerequisiteCourses: ["SYB301"],
    roadmap30Days: [
      "Tuần 1: Khái niệm CI/CD. Làm quen GitHub Actions Workflow (.yaml).",
      "Tuần 2: Tự động chạy Unit Tests và Linter mỗi khi có Pull Request (CI).",
      "Tuần 3: Tự động Build Docker Image và Push lên Docker Hub.",
      "Tuần 4: Tự động Deploy lên server (VPS/AWS/Vercel) khi merge vào nhánh main (CD)."
    ]
  }
];

const map = new Map();
existingTechs.forEach(t => map.set(t.id, t));
advancedTechs.forEach(t => map.set(t.id, t));

const merged = Array.from(map.values());
fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2));
console.log(`Successfully generated technologies.json with ${merged.length} items.`);
