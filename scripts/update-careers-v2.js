const fs = require('fs');
const path = require('path');

const roadmapPath = path.join(__dirname, '..', 'server', 'data', 'knowledge', 'career-roadmaps.json');
const pathPath = path.join(__dirname, '..', 'server', 'data', 'knowledge', 'career-paths.json');

const fullRoadmaps = {
  "Frontend Developer": {
    "careerName": "Frontend Developer",
    "description": "Kỹ sư chuyên phát triển giao diện và trải nghiệm người dùng trên các nền tảng web, biến thiết kế thành các ứng dụng web tương tác.",
    "salaryRange": "8-18 triệu",
    "marketDemand": "HIGH",
    "futureTrend": "Nhu cầu dịch chuyển sang Next.js/SSR và UI components AI-generated.",
    "coreSkills": [
      "HTML",
      "CSS",
      "JavaScript",
      "Responsive Design",
      "Git and GitHub",
      "REST API",
      "Package Managers"
    ],
    "advancedSkills": [
      "React",
      "Next.js",
      "TypeScript",
      "State Management",
      "CSS Frameworks (Tailwind)",
      "Performance Optimization",
      "SEO",
      "Testing"
    ],
    "tools": [
      "VS Code",
      "Git",
      "Figma",
      "Vite",
      "npm/yarn/pnpm"
    ],
    "softSkills": [
      "Attention to detail",
      "Communication",
      "Creativity"
    ],
    "portfolios": [
      {
        "name": "Personal Portfolio",
        "learnToApply": ["HTML", "CSS", "Responsive Design"]
      },
      {
        "name": "Landing Page",
        "learnToApply": ["HTML", "CSS", "JavaScript"]
      },
      {
        "name": "E-Commerce UI",
        "learnToApply": ["React", "CSS Frameworks (Tailwind)"]
      },
      {
        "name": "Dashboard Admin",
        "learnToApply": ["React", "State Management", "Vite"]
      }
    ]
  },
  "React Developer": {
    "careerName": "React Developer",
    "description": "Kỹ sư chuyên sử dụng thư viện React để xây dựng giao diện phức tạp và tương tác cao.",
    "salaryRange": "10-22 triệu",
    "marketDemand": "VERY HIGH",
    "futureTrend": "React 19, Server Components và tích hợp AI.",
    "coreSkills": [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Component Design",
      "State & Props",
      "React Hooks",
      "React Router",
      "REST API"
    ],
    "advancedSkills": [
      "TypeScript",
      "Redux Toolkit",
      "Zustand",
      "Context API",
      "Next.js",
      "Unit Testing (Jest/RTL)",
      "Performance Optimization"
    ],
    "tools": [
      "VS Code",
      "Git",
      "Chrome DevTools",
      "Vite",
      "npm/pnpm",
      "Storybook"
    ],
    "softSkills": [
      "Attention to detail",
      "Problem Solving"
    ],
    "portfolios": [
      {
        "name": "Dashboard Console",
        "learnToApply": ["React", "State & Props", "Vite"]
      },
      {
        "name": "Social Media UI",
        "learnToApply": ["React", "React Hooks", "Context API"]
      },
      {
        "name": "E-Commerce Frontend",
        "learnToApply": ["React", "Redux Toolkit", "Zustand"]
      }
    ]
  },
  "Next.js Developer": {
    "careerName": "Next.js Developer",
    "description": "Kỹ sư React nâng cao chuyên sử dụng framework Next.js để tối ưu SEO và Server-side rendering.",
    "salaryRange": "12-25 triệu",
    "marketDemand": "HIGH",
    "futureTrend": "Server Actions và Edge Computing.",
    "coreSkills": [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Next.js",
      "Routing (App Router)",
      "Data Fetching",
      "SSR/SSG",
      "Styling"
    ],
    "advancedSkills": [
      "TypeScript",
      "API Routes",
      "Caching",
      "Image/Font Optimization",
      "SEO",
      "Middleware",
      "Edge Runtime",
      "NextAuth"
    ],
    "tools": [
      "Vercel",
      "VS Code",
      "Git",
      "Chrome DevTools",
      "npm/pnpm"
    ],
    "softSkills": [
      "Analytical Thinking",
      "Continuous Learning"
    ],
    "portfolios": [
      {
        "name": "Blog CMS",
        "learnToApply": ["Next.js", "SSR/SSG", "SEO"]
      },
      {
        "name": "SaaS Dashboard App",
        "learnToApply": ["Next.js", "TypeScript", "NextAuth"]
      },
      {
        "name": "Company Website",
        "learnToApply": ["Next.js", "Styling", "Image/Font Optimization"]
      }
    ]
  },
  "Backend Developer": {
    "careerName": "Backend Developer",
    "description": "Kỹ sư chuyên phát triển các hệ thống máy chủ, cơ sở dữ liệu, API và xử lý logic nghiệp vụ.",
    "salaryRange": "9-22 triệu",
    "marketDemand": "VERY HIGH",
    "futureTrend": "Microservices, Serverless và bảo mật dữ liệu đang là xu hướng chính.",
    "coreSkills": [
      "JavaScript",
      "Node.js",
      "Express.js",
      "REST API",
      "SQL",
      "PostgreSQL",
      "Linux CLI",
      "Git"
    ],
    "advancedSkills": [
      "Redis",
      "Docker",
      "Microservices",
      "Message Queue",
      "API Design",
      "System Design",
      "Database Design",
      "Web Security (JWT/OAuth)"
    ],
    "tools": [
      "Postman",
      "Docker",
      "Git",
      "Linux Terminal",
      "VS Code"
    ],
    "softSkills": [
      "Problem Solving",
      "Logical Thinking",
      "Teamwork"
    ],
    "portfolios": [
      {
        "name": "Student Management API",
        "learnToApply": ["Express.js", "PostgreSQL", "Web Security (JWT/OAuth)"]
      },
      {
        "name": "Authentication Service",
        "learnToApply": ["Node.js", "Redis", "Web Security (JWT/OAuth)"]
      },
      {
        "name": "E-Commerce API Service",
        "learnToApply": ["Docker", "Microservices", "API Design"]
      }
    ]
  },
  "Node.js Developer": {
    "careerName": "Node.js Developer",
    "description": "Kỹ sư chuyên phát triển ứng dụng backend sử dụng môi trường chạy JavaScript Node.js và các framework liên quan.",
    "salaryRange": "9-20 triệu",
    "marketDemand": "HIGH",
    "futureTrend": "NestJS, TypeScript backend và kiến trúc hướng sự kiện.",
    "coreSkills": [
      "JavaScript",
      "Node.js",
      "Express.js",
      "REST API",
      "npm",
      "Git"
    ],
    "advancedSkills": [
      "TypeScript",
      "NestJS",
      "Fastify",
      "Microservices",
      "Event Loops",
      "Asynchronous programming",
      "Web Security (JWT/OAuth)"
    ],
    "tools": [
      "VS Code",
      "Git",
      "Postman",
      "npm/pnpm/yarn"
    ],
    "softSkills": [
      "Problem Solving",
      "Teamwork"
    ],
    "portfolios": [
      {
        "name": "RESTful Web API",
        "learnToApply": ["Node.js", "Express.js", "Web Security (JWT/OAuth)"]
      },
      {
        "name": "Event-driven Task Runner",
        "learnToApply": ["Node.js", "Asynchronous programming", "Git"]
      }
    ]
  },
  "Full Stack Developer": {
    "careerName": "Full Stack Developer",
    "description": "Kỹ sư đa năng có khả năng xử lý cả Frontend lẫn Backend, có thể tự tin xây dựng toàn bộ ứng dụng từ đầu.",
    "salaryRange": "12-30 triệu",
    "marketDemand": "HIGH",
    "futureTrend": "Chuyển dịch sang các framework fullstack mạnh mẽ như Next.js và Remix.",
    "coreSkills": [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Node.js",
      "Express.js",
      "PostgreSQL",
      "SQL",
      "REST API",
      "Git"
    ],
    "advancedSkills": [
      "TypeScript",
      "Next.js",
      "Redis",
      "NoSQL (MongoDB)",
      "Docker",
      "CI/CD (GitHub Actions)",
      "Cloud Deployment (AWS/Vercel)",
      "System Design",
      "API Security"
    ],
    "tools": [
      "VS Code",
      "Postman",
      "Git",
      "Docker Desktop",
      "Chrome DevTools"
    ],
    "softSkills": [
      "Time Management",
      "Adaptability",
      "Problem Solving"
    ],
    "portfolios": [
      {
        "name": "Fullstack E-Commerce",
        "learnToApply": ["React", "Node.js", "PostgreSQL"]
      },
      {
        "name": "Booking System",
        "learnToApply": ["React", "Express.js", "Redis"]
      },
      {
        "name": "CRM Dashboard App",
        "learnToApply": ["Next.js", "TypeScript", "PostgreSQL"]
      }
    ]
  },
  "Software Engineer": {
    "careerName": "Software Engineer",
    "description": "Kỹ sư phần mềm truyền thống, tập trung vào thuật toán và hệ thống.",
    "salaryRange": "12-30 triệu",
    "marketDemand": "HIGH",
    "futureTrend": "Tích hợp AI trong coding.",
    "coreSkills": [
      "Computer Science Basics",
      "Algorithms & Data Structures",
      "Java/C++/Python",
      "OOP",
      "Database Systems",
      "SQL",
      "Git and GitHub"
    ],
    "advancedSkills": [
      "System Design",
      "Microservices",
      "Design Patterns",
      "API Design",
      "Code Review",
      "Testing",
      "System Architecture"
    ],
    "tools": [
      "Git",
      "Linux Terminal",
      "IDE",
      "Postman"
    ],
    "softSkills": [
      "Analytical Thinking",
      "Problem Solving"
    ],
    "portfolios": [
      {
        "name": "High-concurrency API",
        "learnToApply": ["Java/C++/Python", "OOP", "Database Systems"]
      },
      {
        "name": "Design Pattern Demo",
        "learnToApply": ["Design Patterns", "Algorithms & Data Structures"]
      }
    ]
  },
  "UI Engineer": {
    "careerName": "UI Engineer",
    "description": "Kỹ sư lai giữa Design và Code, chuyên xây dựng các thư viện Component và hệ thống thiết kế (Design Systems).",
    "salaryRange": "10-25 triệu",
    "marketDemand": "MEDIUM",
    "futureTrend": "AI-driven Design Systems.",
    "coreSkills": [
      "HTML",
      "CSS",
      "JavaScript",
      "Responsive Design",
      "Web Accessibility (a11y)",
      "Semantic HTML",
      "CSS Layouts (Flexbox/Grid)"
    ],
    "advancedSkills": [
      "Design Systems",
      "Component Libraries",
      "Storybook",
      "CSS Animations (Framer Motion/GSAP)",
      "Figma to Code",
      "Tailwind CSS"
    ],
    "tools": [
      "Figma",
      "Storybook",
      "VS Code",
      "Chrome DevTools",
      "Git"
    ],
    "softSkills": [
      "Empathy",
      "Creativity"
    ],
    "portfolios": [
      {
        "name": "Design System Package",
        "learnToApply": ["Tailwind CSS", "Storybook", "Design Systems"]
      },
      {
        "name": "Interactive Web Design",
        "learnToApply": ["CSS Layouts (Flexbox/Grid)", "CSS Animations (Framer Motion/GSAP)"]
      }
    ]
  },
  "Flutter Developer": {
    "careerName": "Flutter Developer",
    "description": "Kỹ sư sử dụng Flutter để tạo ứng dụng hiệu năng cao trên cả di động và web.",
    "salaryRange": "10-25 triệu",
    "marketDemand": "HIGH",
    "futureTrend": "Desktop/Web apps using Flutter.",
    "coreSkills": [
      "Dart Programming",
      "Flutter Framework",
      "Widget Lifecycle",
      "Layouts & Gestures",
      "State Management (Provider/Riverpod)",
      "API Integration",
      "Git"
    ],
    "advancedSkills": [
      "Firebase",
      "SQLite (Offline Storage)",
      "Bloc Pattern",
      "Animations",
      "Mobile Performance",
      "Push Notifications",
      "App Store/Play Store Deployment"
    ],
    "tools": [
      "Android Studio",
      "VS Code",
      "Flutter CLI",
      "Xcode",
      "Git",
      "Figma"
    ],
    "softSkills": [
      "Continuous Learning",
      "Teamwork"
    ],
    "portfolios": [
      {
        "name": "E-Commerce Mobile App",
        "learnToApply": ["Flutter Framework", "State Management (Provider/Riverpod)"]
      },
      {
        "name": "Booking Mobile App",
        "learnToApply": ["Flutter Framework", "Firebase", "SQLite (Offline Storage)"]
      }
    ]
  },
  "React Native Developer": {
    "careerName": "React Native Developer",
    "description": "Kỹ sư phát triển ứng dụng di động đa nền tảng (iOS, Android) sử dụng React Native.",
    "salaryRange": "10-25 triệu",
    "marketDemand": "HIGH",
    "futureTrend": "Tích hợp sâu AI và module native.",
    "coreSkills": [
      "JavaScript",
      "React",
      "React Native",
      "Flexbox Layouts",
      "Navigation",
      "State Management",
      "REST API",
      "Git"
    ],
    "advancedSkills": [
      "TypeScript",
      "Expo",
      "Native Modules",
      "Firebase",
      "App Store/Play Store Deployment",
      "Mobile Performance",
      "Push Notifications"
    ],
    "tools": [
      "VS Code",
      "Xcode",
      "Android Studio",
      "Expo CLI",
      "Flipper",
      "Git"
    ],
    "softSkills": [
      "Problem Solving",
      "Adaptability"
    ],
    "portfolios": [
      {
        "name": "Chat Mobile App",
        "learnToApply": ["React Native", "Firebase", "State Management"]
      },
      {
        "name": "Delivery Tracking App",
        "learnToApply": ["React Native", "REST API", "Navigation"]
      }
    ]
  },
  "QA Automation Engineer": {
    "careerName": "QA Automation Engineer",
    "description": "Kỹ sư kiểm thử tự động, viết script thay vì test tay.",
    "salaryRange": "10-25 triệu",
    "marketDemand": "HIGH",
    "futureTrend": "AI-assisted test generation.",
    "coreSkills": [
      "Software Testing Basics",
      "Test Cases & Bug Tracking",
      "API Testing (Postman)",
      "JavaScript/Python",
      "Git"
    ],
    "advancedSkills": [
      "Selenium",
      "Cypress",
      "Playwright",
      "CI/CD Integration",
      "Performance/Load Testing (JMeter)",
      "SQL Basics"
    ],
    "tools": [
      "Postman",
      "Git",
      "Jenkins/GitHub Actions",
      "Chrome DevTools",
      "VS Code"
    ],
    "softSkills": [
      "Attention to detail",
      "Logical Thinking"
    ],
    "portfolios": [
      {
        "name": "Automated Testing Project",
        "learnToApply": ["Cypress", "Playwright", "CI/CD Integration"]
      },
      {
        "name": "API Testing Suite",
        "learnToApply": ["Postman", "Performance/Load Testing (JMeter)"]
      }
    ]
  },
  "DevOps Engineer": {
    "careerName": "DevOps Engineer",
    "description": "Kỹ sư vận hành, tối ưu hóa quá trình phát triển phần mềm qua tự động hóa tích hợp và triển khai (CI/CD).",
    "salaryRange": "15-30 triệu",
    "marketDemand": "VERY HIGH",
    "futureTrend": "DevSecOps và GitOps.",
    "coreSkills": [
      "Linux",
      "Git and GitHub",
      "Bash Scripting",
      "Networking Basics"
    ],
    "advancedSkills": [
      "Docker",
      "Kubernetes",
      "CI/CD Pipelines",
      "Terraform",
      "AWS",
      "Monitoring (Grafana/Prometheus)"
    ],
    "tools": [
      "Docker Desktop",
      "Terraform CLI",
      "AWS CLI",
      "Linux Terminal",
      "Git"
    ],
    "softSkills": [
      "Systematic Thinking",
      "Under-pressure working"
    ],
    "portfolios": [
      {
        "name": "CI/CD Auto-pipeline",
        "learnToApply": ["CI/CD Pipelines", "Docker"]
      },
      {
        "name": "Dockerized Application Cluster",
        "learnToApply": ["Docker", "Monitoring (Grafana/Prometheus)"]
      }
    ]
  },
  "Cloud Engineer": {
    "careerName": "Cloud Engineer",
    "description": "Kỹ sư chuyên thiết kế, triển khai hạ tầng trên đám mây.",
    "salaryRange": "18-40 triệu",
    "marketDemand": "HIGH",
    "futureTrend": "Multi-cloud architecture.",
    "coreSkills": [
      "Linux",
      "Networking",
      "Docker",
      "Cloud Architecture Basics"
    ],
    "advancedSkills": [
      "AWS",
      "Azure",
      "Terraform",
      "Kubernetes",
      "CI/CD",
      "Cloud Security"
    ],
    "tools": [
      "AWS Console/CLI",
      "Linux Terminal",
      "Terraform CLI",
      "Git"
    ],
    "softSkills": [
      "Analytical Thinking"
    ],
    "portfolios": [
      {
        "name": "Cloud Deployment Architecture",
        "learnToApply": ["AWS", "Terraform", "Cloud Security"]
      }
    ]
  },
  "AI Frontend Engineer": {
    "careerName": "AI Frontend Engineer",
    "description": "Kỹ sư Frontend chuyên tích hợp AI vào UI/UX.",
    "salaryRange": "15-30 triệu",
    "marketDemand": "BOOMING",
    "futureTrend": "AI Agents UI.",
    "coreSkills": [
      "React",
      "TypeScript",
      "API Integration",
      "Prompt Engineering",
      "HTML/CSS"
    ],
    "advancedSkills": [
      "OpenAI/Gemini APIs",
      "Retrieval-Augmented Generation (RAG)",
      "AI Chat UI",
      "AI Agents"
    ],
    "tools": [
      "VS Code",
      "Vercel",
      "npm/pnpm",
      "Git",
      "Chrome DevTools"
    ],
    "softSkills": [
      "Innovation",
      "Adaptability"
    ],
    "portfolios": [
      {
        "name": "AI Advisor Bot",
        "learnToApply": ["OpenAI/Gemini APIs", "AI Chat UI"]
      },
      {
        "name": "Smart Dashboard Interface",
        "learnToApply": ["React", "API Integration"]
      }
    ]
  },
  "AI Fullstack Engineer": {
    "careerName": "AI Fullstack Engineer",
    "description": "Kỹ sư Fullstack chuyên phát triển các ứng dụng AI đầu cuối.",
    "salaryRange": "20-40+ triệu",
    "marketDemand": "BOOMING",
    "futureTrend": "Agentic Workflows.",
    "coreSkills": [
      "React",
      "Node.js",
      "PostgreSQL",
      "Python",
      "Prompt Engineering"
    ],
    "advancedSkills": [
      "AI APIs",
      "Vector Database",
      "Retrieval-Augmented Generation (RAG)",
      "LangChain / LlamaIndex",
      "AI Agents"
    ],
    "tools": [
      "Jupyter Notebook",
      "Docker",
      "Postman",
      "VS Code",
      "Git",
      "Pinecone Console"
    ],
    "softSkills": [
      "Problem Solving",
      "Architecture Design"
    ],
    "portfolios": [
      {
        "name": "AI Powered SaaS Application",
        "learnToApply": ["LangChain / LlamaIndex", "Vector Database", "React"]
      },
      {
        "name": "Enterprise Chatbot Service",
        "learnToApply": ["Node.js", "AI APIs", "PostgreSQL"]
      }
    ]
  },
  "Prompt Engineer": {
    "careerName": "Prompt Engineer",
    "description": "Kỹ sư thiết kế và tối ưu câu lệnh (prompts) để khai thác hiệu quả các mô hình ngôn ngữ lớn (LLMs).",
    "salaryRange": "15-35 triệu",
    "marketDemand": "BOOMING",
    "futureTrend": "Tích hợp Multi-modal prompts và AI Agents orchestration.",
    "coreSkills": [
      "Prompt Engineering",
      "LLM Foundations",
      "OpenAI/Gemini APIs",
      "Vector Database"
    ],
    "advancedSkills": [
      "Chain-of-Thought",
      "Few-shot prompting",
      "Prompt Evaluation",
      "Fine-Tuning basics",
      "Agentic Workflows"
    ],
    "tools": [
      "Playground",
      "VS Code",
      "Jupyter Notebook",
      "Git"
    ],
    "softSkills": [
      "Creativity",
      "Analytical Thinking"
    ],
    "portfolios": [
      {
        "name": "RAG Agent Prompts",
        "learnToApply": ["Prompt Engineering", "OpenAI/Gemini APIs"]
      },
      {
        "name": "Multi-Agent System Configuration",
        "learnToApply": ["Agentic Workflows", "Vector Database"]
      }
    ]
  },
  "Software Architect": {
    "careerName": "Software Architect",
    "description": "Kỹ sư kiến trúc phần mềm chịu trách nhiệm thiết kế cấu trúc hệ thống lớn, đảm bảo tính mở rộng, hiệu năng và bảo mật.",
    "salaryRange": "30-60+ triệu",
    "marketDemand": "HIGH",
    "futureTrend": "Decentralized architecture, Cloud-native và AI-assisted architecture design.",
    "coreSkills": [
      "System Architecture",
      "Design Patterns",
      "OOP",
      "SQL",
      "Database Systems",
      "API Design",
      "System Design"
    ],
    "advancedSkills": [
      "Microservices",
      "Distributed Systems",
      "Cloud Architecture",
      "Scalability",
      "Fault Tolerance",
      "High Availability"
    ],
    "tools": [
      "draw.io / Miro",
      "Postman",
      "AWS Console",
      "Docker",
      "Git"
    ],
    "softSkills": [
      "Leadership",
      "Analytical Thinking",
      "Communication"
    ],
    "portfolios": [
      {
        "name": "Distributed Service Architecture Blueprint",
        "learnToApply": ["System Architecture", "Microservices"]
      },
      {
        "name": "Monolith to Microservices migration plan",
        "learnToApply": ["System Design", "Cloud Architecture"]
      }
    ]
  },
  "Solutions Engineer": {
    "careerName": "Solutions Engineer",
    "description": "Kỹ sư giải pháp, làm cầu nối giữa kỹ thuật và kinh doanh.",
    "salaryRange": "15-40 triệu",
    "marketDemand": "HIGH",
    "futureTrend": "Tư vấn AI Solutions.",
    "coreSkills": [
      "System Architecture",
      "API Integration",
      "Database Systems",
      "Communication",
      "Presentation",
      "Technical Writing"
    ],
    "advancedSkills": [
      "Cloud Architecture (AWS/Azure)",
      "Pre-sales & Demos",
      "Proof of Concept (PoC) Development",
      "System Integration",
      "Business Acumen"
    ],
    "tools": [
      "AWS Console",
      "Postman",
      "draw.io / Miro",
      "VS Code",
      "Git"
    ],
    "softSkills": [
      "Presentation",
      "Negotiation",
      "Business Acumen"
    ],
    "portfolios": [
      {
        "name": "Cloud Architecture Proposal",
        "learnToApply": ["Cloud Architecture (AWS/Azure)", "System Integration"]
      }
    ]
  }
};

const careerPaths = {
  "Frontend Developer": {
    "courses": ["COM108", "COM2012", "PRO1014", "WEB1013", "WEB1043", "WEB2063", "WEB3023", "WEB501"],
    "weights": { "WEB1043": 3, "WEB2063": 3, "WEB3023": 3, "COM2012": 1, "COM108": 1 }
  },
  "React Developer": {
    "courses": ["WEB1043", "WEB2063", "WEB2081", "WEB2091", "WEB501", "WEB502"],
    "weights": { "WEB2081": 3, "WEB2091": 3, "WEB2063": 3 }
  },
  "Next.js Developer": {
    "courses": ["WEB1043", "WEB2063", "WEB2081", "WEB2091", "WEB501", "WEB502", "WEB503"],
    "weights": { "WEB2081": 3, "WEB2091": 3, "WEB503": 2 }
  },
  "Backend Developer": {
    "courses": ["COM108", "COM2012", "PRO1014", "WEB108", "WEB2014", "WEB503", "WEB1043"],
    "weights": { "COM2012": 3, "WEB503": 3, "WEB108": 2, "WEB1043": 1, "PRO1014": 1 }
  },
  "Node.js Developer": {
    "courses": ["COM108", "COM2012", "PRO1014", "WEB1043", "WEB503"],
    "weights": { "COM2012": 3, "WEB503": 3, "PRO1014": 1 }
  },
  "Full Stack Developer": {
    "courses": ["COM2012", "WEB1043", "WEB2063", "WEB503", "PRO2201", "WEB2081", "WEB3023"],
    "weights": { "COM2012": 3, "WEB503": 3, "WEB2063": 2, "WEB2081": 2, "PRO2201": 3 }
  },
  "Software Engineer": {
    "courses": ["COM108", "COM2012", "PRO1014", "WEB503", "PRO2201"],
    "weights": { "COM108": 3, "COM2012": 3 }
  },
  "UI Engineer": {
    "courses": ["WEB1013", "WEB1043", "WEB3023", "VIE104", "WEB2063"],
    "weights": { "WEB3023": 3, "WEB1013": 2, "WEB1043": 2 }
  },
  "Flutter Developer": {
    "courses": ["COM108", "COM2012", "PRO1014", "PRO2201", "WEB1043"],
    "weights": { "COM108": 3, "COM2012": 2 }
  },
  "React Native Developer": {
    "courses": ["WEB1043", "WEB2063", "WEB2081", "PRO2201", "WEB501", "WEB502"],
    "weights": { "WEB2081": 3, "WEB2063": 3, "PRO2201": 2 }
  },
  "QA Automation Engineer": {
    "courses": ["COM108", "COM2012", "WEB1043", "WEB2063", "WEB503"],
    "weights": { "WEB1043": 3, "COM2012": 2 }
  },
  "DevOps Engineer": {
    "courses": ["COM108", "COM2012", "WEB503", "WEB108", "PRO2201"],
    "weights": { "COM2012": 3, "WEB503": 2 }
  },
  "Cloud Engineer": {
    "courses": ["COM108", "COM2012", "WEB503", "WEB2014"],
    "weights": { "COM2012": 3, "WEB503": 3 }
  },
  "AI Frontend Engineer": {
    "courses": ["WEB1043", "WEB2063", "WEB2081", "WEB501", "WEB502", "WEB503"],
    "weights": { "WEB2081": 3, "WEB503": 2 }
  },
  "AI Fullstack Engineer": {
    "courses": ["COM2012", "WEB2063", "WEB2081", "WEB503", "PRO2201"],
    "weights": { "WEB503": 3, "COM2012": 3, "WEB2081": 2 }
  },
  "Prompt Engineer": {
    "courses": ["COM108", "COM2012", "WEB1043", "WEB503"],
    "weights": { "COM2012": 2, "WEB503": 3 }
  },
  "Software Architect": {
    "courses": ["COM108", "COM2012", "PRO1014", "WEB503", "PRO2201"],
    "weights": { "COM2012": 3, "WEB503": 3 }
  },
  "Solutions Engineer": {
    "courses": ["COM108", "COM2012", "WEB503", "PRO2201"],
    "weights": { "COM2012": 2, "WEB503": 3 }
  }
};

fs.writeFileSync(roadmapPath, JSON.stringify(fullRoadmaps, null, 2), 'utf-8');
console.log('✅ Overwritten career-roadmaps.json successfully.');

fs.writeFileSync(pathPath, JSON.stringify(careerPaths, null, 2), 'utf-8');
console.log('✅ Overwritten career-paths.json successfully.');
