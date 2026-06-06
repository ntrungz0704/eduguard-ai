import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useStore } from '../store';
import {
  ArrowLeft, Briefcase, TrendingUp, Star, Zap, Code2, Wrench, Users,
  BookOpen, CheckCircle, XCircle, AlertCircle, Target, Rocket, Clock,
  ChevronDown, ChevronRight, Sparkles, Loader2, ExternalLink, FolderGit2,
  GraduationCap, Brain, BarChart3, Info, Calendar, Award, Play, KanbanSquare, Link2, PlusCircle, ChevronLeft, ArrowUpRight
} from 'lucide-react';

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className} style={{ width: props.size, height: props.size }}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const DEMAND_COLORS = {
  'VERY HIGH': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500', label: 'Very High' },
  'HIGH': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500', label: 'High' },
  'BOOMING': { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-500', label: 'Booming 🔥' },
  'MEDIUM': { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', label: 'Medium' },
};

const READINESS_LEVELS = [
  { min: 0, max: 20, label: 'Explorer', color: '#64748b', bg: 'bg-slate-500' },
  { min: 21, max: 40, label: 'Foundation', color: '#f59e0b', bg: 'bg-amber-500' },
  { min: 41, max: 60, label: 'Beginner Intern', color: '#3b82f6', bg: 'bg-blue-500' },
  { min: 61, max: 80, label: 'Internship Ready', color: '#10b981', bg: 'bg-emerald-500' },
  { min: 81, max: 100, label: 'Job Ready', color: '#8b5cf6', bg: 'bg-purple-500' },
];

const SKILL_TIERS_FRONTEND = {
  "node.js": 15, "react": 15, "postgresql": 12, "sql": 10, "javascript": 15,
  "html": 10, "css": 10, "git and github": 10, "rest api": 12, "docker": 10,
  "typescript": 12, "next.js": 12, "state management": 10, "tailwind": 8,
  "performance": 8, "seo": 8, "testing": 10, "prompt engineering": 8
};

function getSkillImpact(skillName) {
  const clean = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, val] of Object.entries(SKILL_TIERS_FRONTEND)) {
    if (clean.includes(key) || key.includes(clean)) return val;
  }
  return 8; // Default impact score
}

function getReadinessConfig(score) {
  return READINESS_LEVELS.find(l => score >= l.min && score <= l.max) || READINESS_LEVELS[0];
}

function getSkillDescription(skillName) {
  const clean = skillName.toLowerCase().trim();
  if (clean.includes("html")) return "HTML (HyperText Markup Language) is the standard markup language for creating web pages and web applications.";
  if (clean.includes("css")) return "CSS (Cascading Style Sheets) is a stylesheet language used to describe the presentation and styling of web pages.";
  if (clean.includes("javascript") || clean.includes("js basics")) return "JavaScript is a high-level, interpreted programming language that conforms to the ECMAScript specification, enabling interactive web pages.";
  if (clean.includes("typescript") || clean.includes("ts")) return "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.";
  if (clean.includes("react")) return "React is a free and open-source front-end JavaScript library for building user interfaces based on components.";
  if (clean.includes("next.js") || clean.includes("nextjs")) return "Next.js is an open-source web development framework created by Vercel enabling React-based web applications with server-side rendering and static website generation.";
  if (clean.includes("node.js") || clean.includes("nodejs")) return "Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser, commonly used for servers.";
  if (clean.includes("express")) return "Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.";
  if (clean.includes("postgresql") || clean.includes("postgres")) return "PostgreSQL is a powerful, open-source object-relational database system with a strong reputation for reliability, feature robustness, and performance.";
  if (clean.includes("sql")) return "SQL (Structured Query Language) is a standardized programming language used to manage relational databases and perform various operations on the data in them.";
  if (clean.includes("docker")) return "Docker is a set of platform as a service products that use OS-level virtualization to deliver software in packages called containers.";
  if (clean.includes("git") || clean.includes("github")) return "Git is a distributed version control system that tracks changes in software source code, while GitHub is a cloud-based hosting service for Git repositories.";
  if (clean.includes("rest api") || clean.includes("api")) return "REST APIs allow client-server communications using standard HTTP requests (GET, POST, PUT, DELETE) and JSON payloads.";
  if (clean.includes("tailwind")) return "Tailwind CSS is a utility-first CSS framework for rapidly building custom user interfaces.";
  if (clean.includes("redux") || clean.includes("state management")) return "State Management manages the state or data flow of complex applications using tools like Redux, Zustand, or Context API.";
  if (clean.includes("testing") || clean.includes("jest")) return "Testing verifies that your code works as expected using Unit, Integration, and End-to-End tests (e.g., Jest, Cypress, RTL).";
  if (clean.includes("prompt")) return "Prompt Engineering is the process of structuring text that can be interpreted and understood by a generative AI model.";
  if (clean.includes("portfolio")) return "Create a real-world project demonstrating your skills to build a strong professional portfolio.";
  if (clean.includes("internship")) return "Prepare CV and practice interview questions to land your first software engineering internship.";
  return `An essential skill required in professional software engineering roles.`;
}

function getRoadmapSource(careerName) {
  const name = String(careerName || '').toLowerCase();
  if (name.includes('react-native') || name.includes('react native')) return 'https://roadmap.sh/react-native';
  if (name.includes('next.js') || name.includes('nextjs')) return 'https://roadmap.sh/nextjs';
  if (name.includes('react')) return 'https://roadmap.sh/react';
  if (name.includes('node.js') || name.includes('nodejs')) return 'https://roadmap.sh/nodejs';
  if (name.includes('javascript') || name.includes('js')) return 'https://roadmap.sh/javascript';
  if (name.includes('typescript') || name.includes('ts')) return 'https://roadmap.sh/typescript';
  if (name.includes('frontend')) return 'https://roadmap.sh/frontend';
  if (name.includes('backend')) return 'https://roadmap.sh/backend';
  if (name.includes('fullstack') || name.includes('full-stack')) return 'https://roadmap.sh/full-stack';
  if (name.includes('devops')) return 'https://roadmap.sh/devops';
  if (name.includes('cloud') || name.includes('aws')) return 'https://roadmap.sh/aws';
  if (name.includes('docker')) return 'https://roadmap.sh/docker';
  if (name.includes('kubernetes') || name.includes('k8s')) return 'https://roadmap.sh/kubernetes';
  if (name.includes('flutter')) return 'https://roadmap.sh/flutter';
  if (name.includes('qa') || name.includes('testing')) return 'https://roadmap.sh/qa';
  if (name.includes('prompt')) return 'https://roadmap.sh/prompt-engineering';
  if (name.includes('ai') || name.includes('artificial')) return 'https://roadmap.sh/ai-engineer';
  if (name.includes('architect')) return 'https://roadmap.sh/software-design-architecture';
  return 'https://roadmap.sh';
}

function getRecommendedResources(skillName) {
  const clean = skillName.toLowerCase();
  if (clean.includes('html') || clean.includes('css')) {
    return {
      docs: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
      video: 'https://www.youtube.com/watch?v=mJgBOIoGihA'
    };
  }
  if (clean.includes('javascript') || clean.includes('js basics')) {
    return {
      docs: 'https://javascript.info/',
      video: 'https://www.youtube.com/watch?v=PkZNo7MFNFg'
    };
  }
  if (clean.includes('typescript')) {
    return {
      docs: 'https://www.typescriptlang.org/docs/',
      video: 'https://www.youtube.com/watch?v=BwuLxPH8IDs'
    };
  }
  if (clean.includes('react')) {
    return {
      docs: 'https://react.dev/',
      video: 'https://www.youtube.com/watch?v=Ke90Tje7VS0'
    };
  }
  if (clean.includes('next.js') || clean.includes('nextjs')) {
    return {
      docs: 'https://nextjs.org/docs',
      video: 'https://www.youtube.com/watch?v=Sklc_fQBMCs'
    };
  }
  if (clean.includes('node.js') || clean.includes('nodejs') || clean.includes('express')) {
    return {
      docs: 'https://nodejs.org/en/docs',
      video: 'https://www.youtube.com/watch?v=TlB_eWDSMt4'
    };
  }
  if (clean.includes('postgresql') || clean.includes('postgres') || clean.includes('sql') || clean.includes('database')) {
    return {
      docs: 'https://www.postgresql.org/docs/',
      video: 'https://www.youtube.com/watch?v=HXV3zeQKqGY'
    };
  }
  if (clean.includes('docker')) {
    return {
      docs: 'https://docs.docker.com/',
      video: 'https://www.youtube.com/watch?v=3c-iKanevgA'
    };
  }
  if (clean.includes('git') || clean.includes('github')) {
    return {
      docs: 'https://git-scm.com/doc',
      video: 'https://www.youtube.com/watch?v=RGOj5yH7evk'
    };
  }
  return {
    docs: 'https://roadmap.sh',
    video: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(skillName + ' tutorial')
  };
}

function getSuggestedProjects(skillName) {
  const clean = skillName.toLowerCase();
  if (clean.includes('html') || clean.includes('css')) return ['Personal Portfolio', 'Landing Page Website'];
  if (clean.includes('javascript') || clean.includes('js basics')) return ['Interactive Calculator', 'Todo Application'];
  if (clean.includes('react')) return ['Movie Search Dashboard', 'Shopping Cart App', 'Trello-like Kanban Board'];
  if (clean.includes('next.js') || clean.includes('nextjs')) return ['SaaS Platform Landing Page', 'Incremental Blog System'];
  if (clean.includes('node.js') || clean.includes('nodejs') || clean.includes('express')) return ['RESTful Task API', 'Realtime Chat Server'];
  if (clean.includes('postgresql') || clean.includes('postgres') || clean.includes('sql') || clean.includes('database')) return ['E-Commerce Database Schema', 'Social Network DB design'];
  if (clean.includes('docker')) return ['Multi-Container Web App Setup', 'Dockerized Node + Postgres API'];
  if (clean.includes('git') || clean.includes('github')) return ['PR Collaboration Demo', 'GitHub Action CI pipeline'];
  return ['Showcase Practice Project', 'Skill Demonstration App'];
}

function getSkillImportance(skillName) {
  const impact = getSkillImpact(skillName);
  if (impact >= 12) return 'Critical 🔥';
  if (impact >= 10) return 'High';
  return 'Medium';
}

function hasSkill(career, skillName) {
  const core = (career.coreSkills || []).map(s => s.toLowerCase());
  const adv = (career.advancedSkills || []).map(s => s.toLowerCase());
  const clean = skillName.toLowerCase();
  return core.includes(clean) || adv.includes(clean) || 
         core.some(s => s.includes(clean) || clean.includes(s)) || 
         adv.some(s => s.includes(clean) || clean.includes(s));
}

function getVisualRoadmapLevels(career) {
  if (!career) return [];
  const name = career.careerName.toLowerCase();
  
  if (name.includes("frontend") || name.includes("react") || name.includes("next.js") || name.includes("ui engineer") || name.includes("ui-engineer")) {
    return [
      { name: 'Level 1: Web & Internet Basics', skills: ['Internet', 'HTML', 'CSS', 'Responsive Design'].filter(s => hasSkill(career, s)), desc: 'Learn how the web works, HTML structure, and CSS styling' },
      { name: 'Level 2: JavaScript & Version Control', skills: ['JavaScript', 'Git and GitHub', 'Git', 'GitHub'].filter(s => hasSkill(career, s)), desc: 'Master JavaScript and collaborate with version control systems' },
      { name: 'Level 3: Package Managers & React', skills: ['Package Managers', 'Vite', 'React', 'CSS Frameworks (Tailwind)', 'Tailwind'].filter(s => hasSkill(career, s)), desc: 'Learn package registries, bundlers, and the React library' },
      { name: 'Level 4: Advanced React, Next.js & TS', skills: ['State Management', 'TypeScript', 'Next.js', 'Redux Toolkit', 'Zustand', 'Context API'].filter(s => hasSkill(career, s)), desc: 'State management, static type safety, and server-side rendering frameworks' },
      { name: 'Level 5: Testing, SEO & Performance', skills: ['Testing', 'Unit Testing (Jest/RTL)', 'SEO', 'Performance Optimization', 'Performance', 'Accessibility'].filter(s => hasSkill(career, s)), desc: 'Write test suites, audit page performance, and optimize web accessibility' },
      { name: 'Level 6: Capstones & Recruitment', skills: ['Portfolio Project', 'Internship Ready'].filter(s => hasSkill(career, s) || ['Portfolio Project', 'Internship Ready'].includes(s)), desc: 'Construct dynamic portfolio pieces and prepare for job applications' }
    ].filter(lvl => lvl.skills.length > 0);
  }

  if (name.includes("backend") || name.includes("node.js") || name.includes("nodejs")) {
    return [
      { name: 'Level 1: Internet & Language Basics', skills: ['Internet', 'JavaScript', 'Node.js Basics', 'Node.js', 'Express'].filter(s => hasSkill(career, s)), desc: 'Understand backend runtimes and build simple request routers' },
      { name: 'Level 2: Version Control & REST APIs', skills: ['Git and GitHub', 'REST API', 'API Design'].filter(s => hasSkill(career, s)), desc: 'Design RESTful routes and manage code versioning' },
      { name: 'Level 3: Relational Databases & SQL', skills: ['SQL', 'PostgreSQL', 'Databases'].filter(s => hasSkill(career, s)), desc: 'Set up tables, relations, and write query optimization scripts' },
      { name: 'Level 4: NoSQL Databases & Security', skills: ['Redis', 'MongoDB', 'Authentication & JWT', 'Security'].filter(s => hasSkill(career, s)), desc: 'Utilize caches, NoSQL stores, and implement security tokens' },
      { name: 'Level 5: DevOps, Docker & Testing', skills: ['Docker', 'Testing', 'CI/CD', 'Performance Tuning'].filter(s => hasSkill(career, s)), desc: 'Containerize microservices and write endpoint test files' },
      { name: 'Level 6: Deployment & Recruitment', skills: ['Portfolio Project', 'Internship Ready'].filter(s => hasSkill(career, s) || ['Portfolio Project', 'Internship Ready'].includes(s)), desc: 'Deploy app live to the cloud and perform system mock interviews' }
    ].filter(lvl => lvl.skills.length > 0);
  }

  if (name.includes("fullstack") || name.includes("full stack") || name.includes("full-stack") || name.includes("software engineer")) {
    return [
      { name: 'Level 1: Web Basics & Layouts', skills: ['HTML', 'CSS', 'Responsive Design', 'Internet'].filter(s => hasSkill(career, s)), desc: 'HTML foundations and basic style grids' },
      { name: 'Level 2: Programming Logic & Git', skills: ['JavaScript', 'TypeScript', 'Git and GitHub'].filter(s => hasSkill(career, s)), desc: 'Version control and core programming patterns' },
      { name: 'Level 3: Client Frameworks & APIs', skills: ['React', 'Next.js', 'REST API', 'Package Managers'].filter(s => hasSkill(career, s)), desc: 'Build front-end application architectures' },
      { name: 'Level 4: Server Runtimes & Databases', skills: ['Node.js', 'Express', 'SQL', 'PostgreSQL'].filter(s => hasSkill(career, s)), desc: 'Build backend logic layers and save persistent data' },
      { name: 'Level 5: Containers & CI/CD Pipelines', skills: ['Docker', 'Testing', 'Zustand', 'State Management'].filter(s => hasSkill(career, s)), desc: 'Deploy containerized web applications with test coverages' },
      { name: 'Level 6: Milestones & Readiness', skills: ['Portfolio Project', 'Internship Ready'].filter(s => hasSkill(career, s) || ['Portfolio Project', 'Internship Ready'].includes(s)), desc: 'Showcase verified software artifacts to hiring panels' }
    ].filter(lvl => lvl.skills.length > 0);
  }

  const core = career.coreSkills || [];
  const adv = career.advancedSkills || [];
  const lvl1 = core.slice(0, Math.ceil(core.length / 2));
  const lvl2 = core.slice(Math.ceil(core.length / 2));
  const lvl3 = adv.slice(0, Math.ceil(adv.length / 2));
  const lvl4 = adv.slice(Math.ceil(adv.length / 2));

  return [
    { name: 'Level 1: Foundations', skills: lvl1, desc: 'Introductory requirements to get started' },
    { name: 'Level 2: Code Practice & Logic', skills: lvl2, desc: 'Core implementation syntax and toolsets' },
    { name: 'Level 3: Libraries & Patterns', skills: lvl3, desc: 'Intermediate patterns and specialized frameworks' },
    { name: 'Level 4: Operations & Tuning', skills: lvl4, desc: 'Advanced topics, performance and deploy details' },
    { name: 'Level 5: Milestones & Career Prep', skills: ['Portfolio Project', 'Internship Ready'], desc: 'Build projects and prepare for recruiter calls' }
  ].filter(lvl => lvl.skills.length > 0);
}

function getDaysOfLearning(task) {
  if (!task || !task.started_at) return 0;
  const start = new Date(task.started_at);
  const end = task.completed_at ? new Date(task.completed_at) : new Date();
  const diffTime = Math.max(0, end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1;
}

function ReadinessGauge({ score, level }) {
  const config = getReadinessConfig(score);
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={config.color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900 dark:text-white">{score}</span>
          <span className="text-[9px] text-slate-500 font-bold">/100</span>
        </div>
      </div>
      <span className="mt-2 text-xs font-black" style={{ color: config.color }}>{level || config.label}</span>
    </div>
  );
}

export default function CareerDetail() {
  const { careerId } = useParams();
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);

  const [career, setCareer] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [generatedProject, setGeneratedProject] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Kanban tasks local state
  const [tasks, setTasks] = useState([]);
  
  // Drag & drop state
  const [dragOverCol, setDragOverCol] = useState(null);
  
  // Evidence Modal State
  const [evidenceModalTask, setEvidenceModalTask] = useState(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');

  const studentId = currentUser?.id || 'SE182001';
  const mode = (currentUser?.role === 'STUDENT' && currentUser?.id) ? 'STUDENT' : 'GUEST';

  // Helper to record learning events in LocalStorage
  const recordLearningEvent = (skillName, fromStatus, toStatus) => {
    const eventsKey = `eduguard_learning_events_${studentId}`;
    const stored = localStorage.getItem(eventsKey);
    const events = stored ? JSON.parse(stored) : [];
    const newEvent = {
      id: `event_${Date.now()}`,
      careerId,
      skill: skillName,
      from: fromStatus,
      to: toStatus,
      timestamp: new Date().toISOString()
    };
    const updated = [newEvent, ...events];
    localStorage.setItem(eventsKey, JSON.stringify(updated));
  };

  // Helper to calculate student's current learning streak
  const getLearningStreak = () => {
    const eventsKey = `eduguard_learning_events_${studentId}`;
    const stored = localStorage.getItem(eventsKey);
    if (!stored) return 0;
    const events = JSON.parse(stored);
    if (events.length === 0) return 0;
    
    // Filter events for this student and unique days
    const dates = [...new Set(events.map(e => e.timestamp.split('T')[0]))].sort().reverse();
    if (dates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // If the latest event isn't today or yesterday, streak is broken
    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
      return 0;
    }
    
    let checkDate = new Date(dates[0]);
    let streak = 1;
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i]);
      const diffTime = Math.abs(checkDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak++;
        checkDate = prevDate;
      } else if (diffDays > 1) {
        break;
      }
    }
    return streak;
  };

  // 1. Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        let careersRes;
        try {
          careersRes = await api.get('/v1/knowledge/careers');
        } catch {
          careersRes = await api.get('/knowledge/careers');
        }
        const allCareers = careersRes.data.data || [];
        const found = allCareers.find(c => c.id === careerId);
        setCareer(found || null);

        if (currentUser?.role === 'STUDENT' && currentUser?.id && found) {
          try {
            let analysisRes;
            try {
              analysisRes = await api.get(`/v1/knowledge/careers/${careerId}/analyze/${currentUser.id}`);
            } catch {
              analysisRes = await api.get(`/knowledge/careers/${careerId}/analyze/${currentUser.id}`);
            }
            setAnalysis(analysisRes.data.data || null);
          } catch (e) {
            console.warn('Analysis not available:', e);
          }
        }
      } catch (err) {
        console.error('Failed to load career:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [careerId, currentUser]);

  // 2. Initialize or load tasks from localStorage
  useEffect(() => {
    if (!analysis || !careerId || !career) return;
    
    const storageKey = `eduguard_roadmap_tasks_${studentId}_${careerId}`;
    const storedTasks = localStorage.getItem(storageKey);
    
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      const allCore = career.coreSkills || [];
      const allAdv = career.advancedSkills || [];
      const allSkills = [
        ...allCore.map(s => ({ name: s, type: 'core' })), 
        ...allAdv.map(s => ({ name: s, type: 'advanced' })),
        { name: 'Portfolio Project', type: 'advanced' },
        { name: 'Internship Ready', type: 'advanced' }
      ];
      
      const initialTasks = allSkills.map((s, idx) => {
        const clean = s.name.toLowerCase();
        const haveCore = (analysis.skillGap?.core?.have || []).map(x => x.toLowerCase());
        const haveAdv = (analysis.skillGap?.advanced?.have || []).map(x => x.toLowerCase());
        
        let status = 'TODO';
        if (haveCore.includes(clean) || haveAdv.includes(clean)) {
          status = 'DONE';
        }
        
        const isStudying = (analysis.academicProgress || []).some(
          c => c.status === 'IN_PROGRESS' && c.skills.some(x => x.toLowerCase() === clean)
        );
        if (isStudying && status !== 'DONE') {
          status = 'IN_PROGRESS';
        }
        
        return {
          id: `${careerId}_task_${idx}`,
          title: s.name,
          type: s.type,
          status,
          impact: getSkillImpact(s.name),
          duration: s.type === 'core' ? '4-6 days' : '7-10 days',
          started_at: status === 'IN_PROGRESS' ? new Date().toISOString().split('T')[0] : null,
          completed_at: status === 'DONE' ? new Date().toISOString().split('T')[0] : null,
          updated_at: new Date().toISOString().split('T')[0],
          github: null,
          demo: null,
          screenshot: null,
          evidenceStatus: status === 'DONE' ? 'VERIFIED' : 'NONE',
          verified: status === 'DONE'
        };
      });
      
      setTasks(initialTasks);
      localStorage.setItem(storageKey, JSON.stringify(initialTasks));
    }
  }, [analysis, careerId, career, studentId]);

  // Save tasks state to localStorage
  const saveTasks = (updatedTasks) => {
    setTasks(updatedTasks);
    localStorage.setItem(`eduguard_roadmap_tasks_${studentId}_${careerId}`, JSON.stringify(updatedTasks));
  };

  // Move task to a new status
  const moveTask = (task, newStatus) => {
    if (newStatus === 'DONE') {
      setEvidenceModalTask(task);
      setGithubUrl(task.github || '');
      setDemoUrl(task.demo || '');
      setScreenshotUrl(task.screenshot || '');
    } else {
      const updated = tasks.map(t => {
        if (t.id === task.id) {
          recordLearningEvent(t.title, t.status, newStatus);
          return {
            ...t,
            status: newStatus,
            started_at: newStatus === 'IN_PROGRESS' ? (t.started_at || new Date().toISOString().split('T')[0]) : null,
            completed_at: null,
            updated_at: new Date().toISOString().split('T')[0],
            github: null,
            demo: null,
            screenshot: null,
            evidenceStatus: 'NONE',
            verified: false
          };
        }
        return t;
      });
      saveTasks(updated);
      // Update selected skill details dynamically if open
      if (selectedSkill && selectedSkill.name === task.title) {
        setSelectedSkill(getSkillDetail(task.title, updated));
      }
    }
  };

  // Submit Evidence
  const handleSubmitEvidence = (e) => {
    e.preventDefault();
    if (!evidenceModalTask) return;
    
    const updated = tasks.map(t => {
      if (t.id === evidenceModalTask.id) {
        recordLearningEvent(t.title, t.status, 'DONE');
        return {
          ...t,
          status: 'DONE',
          completed_at: new Date().toISOString().split('T')[0],
          started_at: t.started_at || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          github: githubUrl || null,
          demo: demoUrl || null,
          screenshot: screenshotUrl || null,
          evidenceStatus: githubUrl ? 'PENDING' : 'NONE',
          verified: false // only verified after simulation approval
        };
      }
      return t;
    });
    
    saveTasks(updated);
    if (selectedSkill && selectedSkill.name === evidenceModalTask.title) {
      setSelectedSkill(getSkillDetail(evidenceModalTask.title, updated));
    }
    setEvidenceModalTask(null);
  };

  // Complete Without Evidence
  const handleCompleteWithoutEvidence = () => {
    if (!evidenceModalTask) return;
    
    const updated = tasks.map(t => {
      if (t.id === evidenceModalTask.id) {
        recordLearningEvent(t.title, t.status, 'DONE');
        return {
          ...t,
          status: 'DONE',
          completed_at: t.completed_at || new Date().toISOString().split('T')[0],
          started_at: t.started_at || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          github: null,
          demo: null,
          screenshot: null,
          evidenceStatus: 'NONE',
          verified: false
        };
      }
      return t;
    });
    
    saveTasks(updated);
    if (selectedSkill && selectedSkill.name === evidenceModalTask.title) {
      setSelectedSkill(getSkillDetail(evidenceModalTask.title, updated));
    }
    setEvidenceModalTask(null);
  };

  // Simulate Teacher/Admin Verification Review
  const simulateEvidenceReview = (taskId, reviewStatus) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          evidenceStatus: reviewStatus,
          verified: reviewStatus === 'VERIFIED',
          updated_at: new Date().toISOString().split('T')[0]
        };
      }
      return t;
    });
    saveTasks(updated);
    if (selectedSkill && selectedSkill.task?.id === taskId) {
      setSelectedSkill(getSkillDetail(selectedSkill.name, updated));
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    if (dragOverCol !== status) {
      setDragOverCol(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      moveTask(task, newStatus);
    }
  };

  // Helper to determine status of a skill in the roadmap
  const getSkillStatus = (skillName) => {
    if (mode === 'GUEST' || tasks.length === 0) return 'none';
    const found = tasks.find(t => t.title.toLowerCase() === skillName.toLowerCase());
    if (found) {
      if (found.status === 'DONE') return 'acquired';
      if (found.status === 'IN_PROGRESS') return 'in_progress';
      return 'missing';
    }
    return 'none';
  };

  // Group career skills into structured levels dynamically
  const levels = useMemo(() => {
    return getVisualRoadmapLevels(career);
  }, [career]);

  // Skill detail description helper (uses local tasks state if available)
  const getSkillDetail = (skillName, currentTasks = tasks) => {
    const courses = (analysis?.academicProgress || []).filter(c =>
      c.skills.some(s => s.toLowerCase().includes(skillName.toLowerCase()) || skillName.toLowerCase().includes(s.toLowerCase()))
    );

    const matchedTask = currentTasks.find(t => t.title.toLowerCase() === skillName.toLowerCase());
    const resources = getRecommendedResources(skillName);
    const projects = getSuggestedProjects(skillName);

    return {
      name: skillName,
      courses: courses.map(c => ({ id: c.courseId, name: c.courseName, status: c.status })),
      description: getSkillDescription(skillName),
      task: matchedTask || null,
      resources,
      projects
    };
  };

  // Dynamic calculated scores based on local Kanban tasks state
  const computedMetrics = useMemo(() => {
    if (!analysis || tasks.length === 0) return { progressPercent: 0, readinessScore: 0, forecasts: [] };
    
    const total = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'DONE');
    const progressPercent = Math.round((doneTasks.length / total) * 100);
    
    // Academic score remains constant (from university records)
    const academicScore = analysis.scores?.academic || 0;
    
    // Industry score: dynamically calculated by weights of completed tasks
    const totalWeight = tasks.reduce((sum, t) => sum + t.impact, 0);
    const acquiredWeight = doneTasks.reduce((sum, t) => sum + t.impact, 0);
    const industryScore = totalWeight > 0 ? (acquiredWeight / totalWeight) * 100 : 0;
    
    // Portfolio score: based on Github evidence
    const verifiedTasksCount = doneTasks.filter(t => t.verified && t.github).length;
    const portfolioScore = Math.min(100, verifiedTasksCount * 33);
    
    // Behavior score: from backend mock/academic
    const behaviorScore = analysis.scores?.behavior || 0;
    
    const readinessScore = Math.round(
      (academicScore * 0.3) + 
      (industryScore * 0.4) + 
      (portfolioScore * 0.2) + 
      (behaviorScore * 0.1)
    );
    
    const activeMissing = tasks.filter(t => t.status !== 'DONE')
                               .sort((a,b) => b.impact - a.impact);
    const forecasts = activeMissing.slice(0, 2).map(t => ({
      action: `Complete learning ${t.title}`,
      points: Math.round((t.impact / (totalWeight || 1)) * 100 * 0.4)
    }));
    
    if (portfolioScore < 100) {
      forecasts.push({
        action: "Upload GitHub evidence for 1 task",
        points: 7
      });
    }

    return {
      progressPercent,
      readinessScore: Math.min(100, Math.max(0, readinessScore)),
      forecasts,
      academicScore,
      industryScore: Math.round(industryScore),
      portfolioScore: Math.round(portfolioScore),
      behaviorScore,
      doneTasksCount: doneTasks.length,
      totalTasksCount: total
    };
  }, [analysis, tasks]);

  // Group tasks by status for Kanban columns
  const columns = useMemo(() => {
    return {
      TODO: tasks.filter(t => t.status === 'TODO'),
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
      DONE: tasks.filter(t => t.status === 'DONE')
    };
  }, [tasks]);

  // Highlight FAILED/Warning academic courses
  const failedCourses = useMemo(() => {
    return (analysis?.academicProgress || []).filter(c => c.status === 'FAILED');
  }, [analysis]);

  // Generate AI portfolio recommendation
  const handleGenerateProject = () => {
    if (!career) return;
    setGenerating(true);
    setTimeout(() => {
      const activeMissing = tasks.filter(t => t.status !== 'DONE')
                                 .sort((a,b) => b.impact - a.impact);
      const techStack = activeMissing.slice(0, 3).map(t => t.title);
      if (techStack.length === 0) {
        techStack.push("Docker", "System Design", "CI/CD");
      }

      let projectName = "Personalized Project";
      let projectDesc = "Build a complete system to showcase your engineering capabilities.";
      let features = ["Responsive layouts", "Logic engine implementation", "Comprehensive testing"];
      let boost = 10;

      const name = career.careerName.toLowerCase();
      if (name.includes("backend")) {
        projectName = "EduGuard Advanced API Gateway";
        projectDesc = `High performance RESTful backend server implementing authentication, caching and query optimization using ${techStack.join(", ")}.`;
        features = [
          "Establish high performance relational/NoSQL schemas.",
          "Implement JWT authorization middleware.",
          "Configure Redis caching nodes.",
          "Build multi-stage Dockerfiles."
        ];
        boost = 12;
      } else if (name.includes("frontend") || name.includes("react") || name.includes("next.js")) {
        projectName = "Interactive SaaS Analytics Dashboard";
        projectDesc = `Responsive and SEO optimized dashboard UI tracking complex metrics, utilizing dynamic states and ${techStack.join(", ")}.`;
        features = [
          "Develop interactive chart widgets and panels.",
          "Establish global application state management.",
          "Implement Server-Side Rendering (SSR) logic.",
          "Write component unit tests using Jest."
        ];
        boost = 10;
      } else if (name.includes("mobile") || name.includes("flutter") || name.includes("react native")) {
        projectName = "Smart Campus Companion Mobile App";
        projectDesc = `Multiplatform mobile application connecting students with schedule lookups and push notifications, built using ${techStack.join(", ")}.`;
        features = [
          "Design slick, modern mobile UX components.",
          "Integrate GPS location APIs.",
          "Handle local database syncing for offline usage.",
          "Establish push notifications alerts."
        ];
        boost = 15;
      } else if (name.includes("devops") || name.includes("cloud")) {
        projectName = "Automated GitOps Infrastructure Pipeline";
        projectDesc = `Scalable cloud infrastructure configured dynamically via pipelines and alerts using ${techStack.join(", ")}.`;
        features = [
          "Deploy Infrastructure as Code scripts (Terraform).",
          "Establish automated GitHub Actions CI/CD workflows.",
          "Deploy Grafana dashboard indicators.",
          "Configure load balancers and auto-scaling rules."
        ];
        boost = 15;
      } else if (name.includes("ai")) {
        projectName = "RAG AI Academic Advisor Bot";
        projectDesc = `Semantic search academic chatbot running RAG pipelines over campus handbooks utilizing LLM APIs and ${techStack.join(", ")}.`;
        features = [
          "Build document parser scripts.",
          "Load data vectors into vector databases.",
          "Connect LLM models (OpenAI/Gemini APIs).",
          "Build clean streaming response chat UI."
        ];
        boost = 14;
      }

      setGeneratedProject({
        name: projectName,
        description: projectDesc,
        techStack,
        features,
        boost
      });
      setGenerating(false);
    }, 1500);
  };

  // 90-Day Plan calculation
  const weeklyPlan = useMemo(() => {
    if (!career) return [];
    
    const missingCore = tasks.filter(t => t.status !== 'DONE' && t.type === 'core').map(t => t.title);
    const missingAdv = tasks.filter(t => t.status !== 'DONE' && t.type === 'advanced').map(t => t.title);

    const core = missingCore.length > 0 ? missingCore : (career.coreSkills || []);
    const adv = missingAdv.length > 0 ? missingAdv : (career.advancedSkills || []);
    const targetProject = career.portfolios?.[0]?.name || "Personal Portfolio Project";
    
    const name = career.careerName.toLowerCase();
    const isFrontend = name.includes('frontend') || name.includes('react') || name.includes('next.js') || name.includes('ui');

    return [
      {
        weeks: 'Weeks 1-2',
        title: 'Foundational Basics',
        skills: core.slice(0, 2),
        action: `Practice syntax and construct simple projects in: ${core.slice(0, 2).join(', ') || 'basics'}.`,
        duration: '1-2 hours / day'
      },
      {
        weeks: 'Weeks 3-4',
        title: 'Core Programming & Version Control',
        skills: core.slice(2, 4),
        action: `Understand asynchronous flows, standard functions and state control in: ${core.slice(2, 4).join(', ') || 'programming logic'}.`,
        duration: '2 hours / day'
      },
      {
        weeks: 'Weeks 5-6',
        title: isFrontend ? 'Framework Setup & APIs' : 'Databases & REST APIs',
        skills: core.slice(4).concat(adv.slice(0, 1)),
        action: isFrontend 
          ? `Learn npm package setups and construct reusable React UI modules.`
          : `Design data models, write structured queries, and establish secure endpoints.`,
        duration: '1.5-2 hours / day'
      },
      {
        weeks: 'Weeks 7-8',
        title: isFrontend ? 'Advanced Client Frameworks' : 'Framework Patterns & Optimization',
        skills: adv.slice(1, 3),
        action: `Implement advanced hooks, performance tracing, routing layouts, and testing suites.`,
        duration: '2 hours / day'
      },
      {
        weeks: 'Weeks 9-10',
        title: 'Build Portfolio Project',
        skills: ['Portfolio Project'],
        action: `Implement the recommended project: "${targetProject}". Commit code daily and push to GitHub.`,
        duration: '3 hours / day'
      },
      {
        weeks: 'Weeks 11-12',
        title: isFrontend ? 'Testing, SEO & Accessibility' : 'Docker, Cloud Deploy & Interviews',
        skills: isFrontend 
          ? ['SEO', 'Testing', 'Accessibility', 'Resume practice']
          : adv.slice(3).concat(['Resume practice']),
        action: isFrontend
          ? `Run SEO checks, implement accessibility rules, and practice frontend interviews.`
          : `Containerize and deploy application demo. Fine-tune CV reflecting newly completed roadmap skills.`,
        duration: '2 hours / day'
      }
    ].filter(w => w.skills.length > 0 || w.title.includes('Portfolio') || w.title.includes('Deploy') || w.title.includes('SEO'));
  }, [career, tasks]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center py-32">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Syncing career roadmap data...</p>
        </div>
      </div>
    );
  }

  if (!career) {
    return (
      <div className="text-center py-32">
        <p className="text-slate-500 font-bold">Career path not found</p>
        <button onClick={() => navigate('/career-universe')} className="mt-4 text-blue-500 text-sm font-bold hover:underline">← Back to Career Universe</button>
      </div>
    );
  }

  const demand = DEMAND_COLORS[career.marketDemand] || DEMAND_COLORS['MEDIUM'];

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button */}
      <button
        onClick={() => navigate('/career-universe')}
        className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Career Universe
      </button>

      {/* Redesigned Hero Card */}
      <div className="glass-card rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-gradient-to-br dark:from-blue-950/30 dark:to-indigo-950/20 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 text-blue-500/10"><Sparkles size={120} /></div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center justify-between w-full">
          {/* Left Info */}
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">Detailed Path</span>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-2 mb-2 leading-tight">{career.careerName}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">{career.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${demand.bg} ${demand.border} ${demand.text}`}>
                <TrendingUp size={12} /> Market Demand: {demand.label}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                💰 Salary: {career.salaryRange}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-blue-500/5 border-blue-500/10 text-blue-600 dark:text-blue-400">
                📚 Source: {getRoadmapSource(career.careerName).replace('https://', '')}
              </span>
            </div>
            
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-semibold">
              * Lộ trình đã được AI chuẩn hóa từ tài liệu thực tế của {getRoadmapSource(career.careerName).replace('https://', '')} và ánh xạ trực tiếp với chương trình đào tạo của FPT Polytechnic.
            </p>
          </div>

          {/* Right Readiness Gauge & Progress bar */}
          {analysis && (
            <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shrink-0 w-full lg:w-auto">
              <ReadinessGauge score={computedMetrics.readinessScore} level={getReadinessConfig(computedMetrics.readinessScore).label} />
              
              {/* Contribution Breakdown */}
              <div className="flex flex-col justify-center gap-1 border-l border-slate-200 dark:border-white/10 pl-5 text-[10px] font-bold text-slate-600 dark:text-slate-400 h-full shrink-0">
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 block">Score Contribution</span>
                <div className="flex justify-between gap-4 w-32"><span>Academic:</span> <span className="text-slate-900 dark:text-white font-extrabold">{Math.round((computedMetrics.academicScore / 100) * 30)}/30</span></div>
                <div className="flex justify-between gap-4 w-32"><span>Industry:</span> <span className="text-slate-900 dark:text-white font-extrabold">{Math.round((computedMetrics.industryScore / 100) * 40)}/40</span></div>
                <div className="flex justify-between gap-4 w-32"><span>Portfolio:</span> <span className="text-slate-900 dark:text-white font-extrabold">{Math.round((computedMetrics.portfolioScore / 100) * 20)}/20</span></div>
                <div className="flex justify-between gap-4 w-32"><span>Behavior:</span> <span className="text-slate-900 dark:text-white font-extrabold">{Math.round((computedMetrics.behaviorScore / 100) * 10)}/10</span></div>
              </div>

              <div className="space-y-2 w-full md:w-48 border-l border-slate-200 dark:border-white/10 pl-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Roadmap Progress</span>
                    <span>{computedMetrics.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${computedMetrics.progressPercent}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Completed: {computedMetrics.doneTasksCount}/{computedMetrics.totalTasksCount} skills</p>
                </div>
                {getLearningStreak() > 0 && (
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 w-fit animate-pulse">
                      🔥 {getLearningStreak()} Day Learning Streak
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto gap-2 pb-px scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: <Info size={14} /> },
          { id: 'roadmap', label: 'Visual Roadmap', icon: <BookOpen size={14} /> },
          { id: 'board', label: 'Learning Board', icon: <KanbanSquare size={14} />, badge: mode === 'STUDENT' },
          { id: 'skills', label: 'Skill Gap', icon: <Target size={14} />, badge: mode === 'STUDENT' },
          { id: 'portfolio', label: 'AI Portfolio', icon: <FolderGit2 size={14} /> },
          { id: 'plan90', label: '90-Day Plan', icon: <Calendar size={14} />, badge: mode === 'STUDENT' },
          { id: 'action', label: 'Action Plan', icon: <Award size={14} />, show: mode === 'STUDENT' }
        ].map(tab => {
          if (tab.show === false) return null;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedSkill(null);
              }}
              className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-xs whitespace-nowrap transition-all relative cursor-pointer ${
                isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute top-2 right-2 animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div className="mt-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-500" /> Professional Roles & Operations
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  In this role, you will participate directly in drafting, building, and optimizing modern software infrastructure. You will work with engineers, product owners, and designers to transition requirements into stable, test-backed code deployed onto live production servers.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Common Work Operations</h4>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4">
                      <li>Write clean, scalable, and test-supported code.</li>
                      <li>Participate in review pipelines and architecture audits.</li>
                      <li>Debug errors and improve application latency.</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Core Requirements</h4>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4">
                      <li>Adapt quickly to evolving tools and specifications.</li>
                      <li>Excellent problem-solving and peer communication.</li>
                      <li>Proficient usage of Git version control and GitHub boards.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {career.futureTrend && (
                <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <TrendingUp size={18} className="text-blue-500" /> Future Market Trends
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {career.futureTrend}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Technical Skills Summary</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Core Skills ({career.coreSkills?.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(career.coreSkills || []).map((s, i) => (
                        <span key={i} className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Advanced Skills ({career.advancedSkills?.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(career.advancedSkills || []).map((s, i) => (
                        <span key={i} className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10 text-blue-600 dark:text-blue-400">{s}</span>
                      ))}
                    </div>
                  </div>
                  {(career.tools || []).length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Common Tools</span>
                      <div className="flex flex-wrap gap-1.5">
                        {career.tools.map((t, i) => (
                          <span key={i} className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VISUAL ROADMAP (TIMELINE GRID / BRANCHING FLOW) */}
        {activeTab === 'roadmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sơ đồ Visual Path */}
            <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-slate-500/5 pointer-events-none"><BookOpen size={200} /></div>
              
              <div className="text-center mb-8">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Timeline Roadmap</h3>
                <p className="text-xs text-slate-500 mt-1">Click skill nodes to check mapped university courses, readiness weight, and submit learning evidence</p>
              </div>

              <div className="w-full flex flex-col items-center z-10 relative">
                {/* Vertical timeline connector */}
                <div className="absolute left-1/2 top-4 bottom-4 w-1 bg-slate-200 dark:bg-slate-800 -translate-x-1/2 hidden md:block" />

                {levels.map((lvl, idx) => (
                  <div key={idx} className="w-full flex flex-col items-center relative mb-8 last:mb-0">
                    
                    {/* Level Card */}
                    <div className="z-10 w-full max-w-xl text-center bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-4 mb-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-all shadow-sm">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 mb-1 inline-block">
                        Level {idx + 1}
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">{lvl.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{lvl.desc}</p>
                    </div>
                    
                    {/* Skill Nodes Grid */}
                    <div className="flex flex-wrap justify-center gap-3 max-w-2xl z-10">
                      {lvl.skills.map((skill, sIdx) => {
                        const status = getSkillStatus(skill);
                        const isSelected = selectedSkill?.name === skill;
                        const impact = getSkillImpact(skill);
                        return (
                          <button
                            key={sIdx}
                            onClick={() => setSelectedSkill(getSkillDetail(skill))}
                            className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5 duration-200 flex items-center gap-2 cursor-pointer shadow-sm ${
                              status === 'acquired' 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/5' 
                                : status === 'in_progress' 
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 animate-pulse' 
                                : status === 'missing'
                                ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                                : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                            } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950 scale-105' : ''}`}
                          >
                            {status === 'acquired' && <CheckCircle size={12} className="text-emerald-500" />}
                            {status === 'in_progress' && <Clock size={12} className="text-amber-500" />}
                            {status === 'missing' && <AlertCircle size={12} className="text-slate-400" />}
                            <span>{skill}</span>
                            <span className="text-[9px] opacity-75 font-normal">+{impact} Pt</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Details Panel */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Info size={16} className="text-blue-500" /> Detail Inspector
                </h3>
                
                {selectedSkill ? (
                  <div className="space-y-5 animate-fadeIn">
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">{selectedSkill.name}</h4>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0">
                          +{getSkillImpact(selectedSkill.name)} Pt Impact
                        </span>
                        {selectedSkill.task?.started_at && (
                          <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 shrink-0">
                            ⏱️ {getDaysOfLearning(selectedSkill.task)} {getDaysOfLearning(selectedSkill.task) === 1 ? 'Day' : 'Days'} Active
                          </span>
                        )}
                        {selectedSkill.task?.completed_at && (
                          <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                            ✓ Done in {getDaysOfLearning(selectedSkill.task)} {getDaysOfLearning(selectedSkill.task) === 1 ? 'Day' : 'Days'}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {selectedSkill.description}
                    </p>

                    {/* Importance & Resources Info */}
                    <div className="space-y-3 pt-1">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Roadmap Source:</span>
                        <a 
                          href={getRoadmapSource(selectedSkill.name) === 'https://roadmap.sh' ? getRoadmapSource(career.careerName) : getRoadmapSource(selectedSkill.name)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-extrabold"
                        >
                          {(getRoadmapSource(selectedSkill.name) === 'https://roadmap.sh' ? getRoadmapSource(career.careerName) : getRoadmapSource(selectedSkill.name)).replace('https://', '')} <ExternalLink size={10} />
                        </a>
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Importance Level:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          getSkillImportance(selectedSkill.name) === 'Critical 🔥' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          getSkillImportance(selectedSkill.name) === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                          'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                        }`}>
                          {getSkillImportance(selectedSkill.name)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Readiness Impact:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">+{getSkillImpact(selectedSkill.name)} Pts</span>
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Est. Learning Time:</span>
                        <span className="text-slate-900 dark:text-white font-black">{selectedSkill.task?.duration || '4-6 days'}</span>
                      </div>
                    </div>

                    {/* Recommended Resources */}
                    {selectedSkill.resources && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Recommended Resources:</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <a href={selectedSkill.resources.docs} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors">
                            <BookOpen size={12} /> Official Docs
                          </a>
                          <a href={selectedSkill.resources.video} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors">
                            <Play size={12} /> Video Tutorial
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Suggested Projects */}
                    {selectedSkill.projects && selectedSkill.projects.length > 0 && (
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Suggested Practice Projects:</h5>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-4 font-medium">
                          {selectedSkill.projects.map((proj, i) => (
                            <li key={i}>{proj}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Status Changer Actions */}
                    {mode === 'STUDENT' && selectedSkill.task && (
                      <div className="border-t border-b border-slate-100 dark:border-white/5 py-3 space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Change Status:</span>
                        
                        {selectedSkill.task.status === 'TODO' && (
                          <button
                            onClick={() => moveTask(selectedSkill.task, 'IN_PROGRESS')}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                          >
                            <Play size={12} /> Start Learning
                          </button>
                        )}

                        {selectedSkill.task.status === 'IN_PROGRESS' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveTask(selectedSkill.task, 'TODO')}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => moveTask(selectedSkill.task, 'DONE')}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                            >
                              <CheckCircle size={12} /> Mark Done
                            </button>
                          </div>
                        )}

                        {selectedSkill.task.status === 'DONE' && (
                          <div className="space-y-2">
                            {selectedSkill.task.github ? (
                              <div className={`p-3 border rounded-xl space-y-2 ${
                                selectedSkill.task.evidenceStatus === 'VERIFIED' ? 'bg-emerald-500/5 border-emerald-500/15' :
                                selectedSkill.task.evidenceStatus === 'REJECTED' ? 'bg-rose-500/5 border-rose-500/15' :
                                'bg-amber-500/5 border-amber-500/15'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className={`text-[9px] font-black uppercase flex items-center gap-1 ${
                                    selectedSkill.task.evidenceStatus === 'VERIFIED' ? 'text-emerald-500' :
                                    selectedSkill.task.evidenceStatus === 'REJECTED' ? 'text-rose-500' :
                                    'text-amber-500'
                                  }`}>
                                    <Award size={10} /> 
                                    {selectedSkill.task.evidenceStatus === 'VERIFIED' ? 'Verified Evidence ✓' :
                                     selectedSkill.task.evidenceStatus === 'REJECTED' ? 'Evidence Rejected ✗' :
                                     'Pending Verification ⏳'}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <a href={selectedSkill.task.github} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                    <GithubIcon size={12} /> GitHub Repository <ArrowUpRight size={10} />
                                  </a>
                                  {selectedSkill.task.demo && (
                                    <a href={selectedSkill.task.demo} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                      <Link2 size={12} /> Live Demo <ArrowUpRight size={10} />
                                    </a>
                                  )}
                                  {selectedSkill.task.screenshot && (
                                    <a href={selectedSkill.task.screenshot} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                      <Link2 size={12} /> Screenshot URL <ArrowUpRight size={10} />
                                    </a>
                                  )}
                                </div>

                                {/* Simulator Reviewer Buttons */}
                                {selectedSkill.task.evidenceStatus === 'PENDING' && (
                                  <div className="flex gap-1.5 pt-1.5 border-t border-slate-100 dark:border-white/5">
                                    <button
                                      onClick={() => simulateEvidenceReview(selectedSkill.task.id, 'VERIFIED')}
                                      className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black rounded-lg cursor-pointer text-center"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => simulateEvidenceReview(selectedSkill.task.id, 'REJECTED')}
                                      className="flex-1 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black rounded-lg cursor-pointer text-center"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}

                                {selectedSkill.task.evidenceStatus === 'REJECTED' && (
                                  <div className="pt-1.5 border-t border-slate-100 dark:border-white/5">
                                    <button
                                      onClick={() => simulateEvidenceReview(selectedSkill.task.id, 'PENDING')}
                                      className="w-full py-1 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[9px] font-bold rounded-lg cursor-pointer text-center"
                                    >
                                      Resubmit for Review
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">No links submitted yet.</p>
                            )}
                            <button
                              onClick={() => moveTask(selectedSkill.task, 'DONE')}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl cursor-pointer hover:bg-blue-500/5"
                            >
                              <PlusCircle size={12} /> Update GitHub Links
                            </button>
                            <button
                              onClick={() => moveTask(selectedSkill.task, 'TODO')}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl cursor-pointer hover:bg-red-500/5"
                            >
                              Revert to TO DO
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Academic Course Mapping */}
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">School Course Mapping:</h5>
                      {selectedSkill.courses.length > 0 ? (
                        <div className="space-y-2">
                          {selectedSkill.courses.map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-white/2 border border-slate-200/60 dark:border-white/5">
                              <div className="truncate pr-2">
                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{c.id}</p>
                                <p className="text-[10px] text-slate-500 truncate">{c.name}</p>
                              </div>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${
                                c.status === 'PASSED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                c.status === 'FAILED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse' :
                                'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                              }`}>
                                {c.status === 'PASSED' ? 'Passed' : c.status === 'FAILED' ? 'Failed' : 'Not Started'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">This skill is not taught directly in the school curriculum - self-study is highly recommended.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* No node selected: Render AI Coach Analytics panel */
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-cyan-400">
                      <Sparkles size={16} />
                      <h4 className="text-xs font-black uppercase tracking-wider">AI Coach Overview</h4>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2.5 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Readiness level:</span>
                        <span className="text-blue-500 font-extrabold uppercase">{getReadinessConfig(computedMetrics.readinessScore).label}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Estimated Study Time:</span>
                        <span className="text-slate-900 dark:text-white font-black">{analysis?.estimatedMonthsText || 'N/A'}</span>
                      </div>
                    </div>

                    {/* FAILED courses warnings */}
                    {failedCourses.length > 0 && (
                      <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2 animate-pulse">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">⚠️ Academic Debt Warning</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                          You have failed the following courses related to this career path. Re-take them immediately to restore your match score:
                        </p>
                        <div className="space-y-1">
                          {failedCourses.map((c, i) => (
                            <div key={i} className="text-xs font-black text-rose-500 flex justify-between">
                              <span>• {c.courseId} - {c.courseName}</span>
                              <span>Failed 🔴</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Forecast panel */}
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">🔮 AI Learning Forecast</span>
                      <div className="space-y-2">
                        {computedMetrics.forecasts.length > 0 ? (
                          computedMetrics.forecasts.map((f, i) => (
                            <div key={i} className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                              <span className="truncate pr-2">• {f.action}</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-black">+{f.points} Pt</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">All milestones completed!</p>
                        )}
                      </div>
                      <div className="border-t border-emerald-500/10 pt-2 flex justify-between items-center text-xs font-black text-emerald-600 dark:text-emerald-400">
                        <span>Projected Readiness:</span>
                        <span>{Math.min(100, computedMetrics.readinessScore + computedMetrics.forecasts.reduce((sum, f) => sum + f.points, 0))}/100</span>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 font-bold italic text-center">Click a skill node to view detailed course mapping and actions.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LEARNING KANBAN BOARD (DRAG AND DROP) */}
        {activeTab === 'board' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: TODO */}
            <div 
              onDragOver={(e) => handleDragOver(e, 'TODO')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'TODO')}
              className={`glass-card rounded-2xl border p-5 space-y-4 transition-all duration-200 ${
                dragOverCol === 'TODO' 
                  ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                  : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/20'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">TO DO</h3>
                </div>
                <span className="text-xs font-black bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-slate-500">{columns.TODO.length}</span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {columns.TODO.map(task => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className="glass-card bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/5 p-4 space-y-3 hover:border-blue-500/30 transition-all group cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{task.title}</h4>
                      <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0">+{task.impact} Pt</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Estimate: {task.duration}</span>
                      <button 
                        onClick={() => moveTask(task, 'IN_PROGRESS')}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Start Learning <Play size={10} />
                      </button>
                    </div>
                  </div>
                ))}
                {columns.TODO.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-8">No tasks left to learn!</p>
                )}
              </div>
            </div>

            {/* Column 2: IN PROGRESS */}
            <div 
              onDragOver={(e) => handleDragOver(e, 'IN_PROGRESS')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
              className={`glass-card rounded-2xl border p-5 space-y-4 transition-all duration-200 ${
                dragOverCol === 'IN_PROGRESS' 
                  ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                  : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/20'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">IN PROGRESS</h3>
                </div>
                <span className="text-xs font-black bg-blue-500/10 px-2 py-0.5 rounded text-blue-500">{columns.IN_PROGRESS.length}</span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {columns.IN_PROGRESS.map(task => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className="glass-card bg-white dark:bg-slate-900/60 rounded-xl border border-blue-500/20 dark:border-blue-500/30 p-4 space-y-3 shadow-sm shadow-blue-500/5 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{task.title}</h4>
                      <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0">+{task.impact} Pt</span>
                    </div>
                    {task.started_at && (
                      <div className="flex flex-col gap-0.5 text-[9px] text-slate-400 font-bold">
                        <p className="flex items-center gap-1"><Calendar size={10} /> Start Date: {task.started_at}</p>
                        <p className="flex items-center gap-1">⏱️ Learning: {getDaysOfLearning(task)} {getDaysOfLearning(task) === 1 ? 'day' : 'days'}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/5">
                      <button 
                        onClick={() => moveTask(task, 'TODO')}
                        className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <ChevronLeft size={10} /> Cancel
                      </button>
                      <button 
                        onClick={() => moveTask(task, 'DONE')}
                        className="text-[10px] font-black text-emerald-500 hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        Done <CheckCircle size={10} />
                      </button>
                    </div>
                  </div>
                ))}
                {columns.IN_PROGRESS.length === 0 && (
                  <div className="border border-dashed border-slate-300 dark:border-white/10 rounded-xl p-8 text-center text-slate-500 italic text-xs">
                    Drag & drop cards here or click "Start Learning"
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: DONE */}
            <div 
              onDragOver={(e) => handleDragOver(e, 'DONE')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'DONE')}
              className={`glass-card rounded-2xl border p-5 space-y-4 transition-all duration-200 ${
                dragOverCol === 'DONE' 
                  ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                  : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/20'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">DONE</h3>
                </div>
                <span className="text-xs font-black bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-500">{columns.DONE.length}</span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {columns.DONE.map(task => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className="glass-card bg-white dark:bg-slate-900/60 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30 p-4 space-y-3 hover:border-emerald-500/40 transition-all cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                        {task.title}
                      </h4>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                        task.evidenceStatus === 'VERIFIED' ? 'bg-emerald-500/10 border-emerald-200 text-emerald-600 dark:text-emerald-400' :
                        task.evidenceStatus === 'REJECTED' ? 'bg-rose-500/10 border-rose-200 text-rose-600 dark:text-rose-400' :
                        task.evidenceStatus === 'PENDING' ? 'bg-amber-500/10 border-amber-200 text-amber-600 dark:text-amber-400 animate-pulse' :
                        'bg-slate-100 border-slate-200 text-slate-500'
                      }`}>
                        {task.evidenceStatus === 'VERIFIED' ? 'Verified' :
                         task.evidenceStatus === 'REJECTED' ? 'Rejected' :
                         task.evidenceStatus === 'PENDING' ? 'Pending' :
                         'Completed'}
                      </span>
                    </div>

                    <div className="space-y-1 text-[9px] text-slate-400 font-bold">
                      {task.completed_at && (
                        <div className="flex flex-col gap-0.5">
                          <p className="flex items-center gap-1"><Calendar size={10} /> Completed: {task.completed_at}</p>
                          {task.started_at && <p className="flex items-center gap-1">⏱️ Took: {getDaysOfLearning(task)} {getDaysOfLearning(task) === 1 ? 'day' : 'days'}</p>}
                        </div>
                      )}
                      {task.github ? (
                        <div className="flex flex-col gap-1 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-white/5 space-y-1">
                          <div className="text-[9px] uppercase tracking-wider text-slate-500">Learning Evidence:</div>
                          <a href={task.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline">
                            <GithubIcon size={10} /> GitHub Repository <ArrowUpRight size={8} />
                          </a>
                          {task.demo && (
                            <a href={task.demo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline">
                              <Link2 size={10} /> Live Demo <ArrowUpRight size={8} />
                            </a>
                          )}
                          {task.screenshot && (
                            <a href={task.screenshot} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline">
                              <Link2 size={10} /> Screenshot <ArrowUpRight size={8} />
                            </a>
                          )}

                          {task.evidenceStatus === 'VERIFIED' && (
                            <span className="inline-flex items-center gap-1 text-[8px] font-extrabold text-emerald-500 mt-1"><Award size={8} /> Portfolio Score Added (+{Math.round(task.impact * 0.3)} Pts)</span>
                          )}

                          {task.evidenceStatus === 'PENDING' && (
                            <div className="flex gap-1 pt-1.5">
                              <button
                                onClick={() => simulateEvidenceReview(task.id, 'VERIFIED')}
                                className="flex-1 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black rounded cursor-pointer text-center"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => simulateEvidenceReview(task.id, 'REJECTED')}
                                className="flex-1 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[8px] font-black rounded cursor-pointer text-center"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                          <button
                            onClick={() => moveTask(task, 'DONE')}
                            className="inline-flex items-center gap-1 text-[9px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            <PlusCircle size={10} /> Add GitHub Evidence
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {columns.DONE.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-8">No completed tasks yet</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: SKILL GAP */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            {mode === 'STUDENT' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Have Skills */}
                <div className="glass-card rounded-2xl border border-emerald-200 dark:border-emerald-500/20 p-6 bg-emerald-500/5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <CheckCircle size={18} className="text-emerald-500" /> Acquired Skills ({ (analysis?.skillGap?.core?.have?.length || 0) + (analysis?.skillGap?.advanced?.have?.length || 0) })
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Core Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {(analysis?.skillGap?.core?.have || []).map((s, i) => (
                          <span key={i} className="text-xs font-bold bg-white dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-400">{s}</span>
                        ))}
                        {(analysis?.skillGap?.core?.have || []).length === 0 && <span className="text-xs text-slate-500 italic">No core skills acquired yet</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Advanced Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {(analysis?.skillGap?.advanced?.have || []).map((s, i) => (
                          <span key={i} className="text-xs font-bold bg-white dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-400">{s}</span>
                        ))}
                        {(analysis?.skillGap?.advanced?.have || []).length === 0 && <span className="text-xs text-slate-500 italic">No advanced skills acquired yet</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="glass-card rounded-2xl border border-rose-200 dark:border-rose-500/20 p-6 bg-rose-500/5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <XCircle size={18} className="text-rose-500" /> Missing Skills ({ (analysis?.skillGap?.core?.missing?.length || 0) + (analysis?.skillGap?.advanced?.missing?.length || 0) })
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">Missing Core Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {(analysis?.skillGap?.core?.missing || []).map((s, i) => (
                          <span key={i} className="text-xs font-bold bg-white dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-lg text-rose-700 dark:text-rose-400">{s}</span>
                        ))}
                        {(analysis?.skillGap?.core?.missing || []).length === 0 && <span className="text-xs text-slate-500 italic">No missing core skills!</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">Missing Advanced Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {(analysis?.skillGap?.advanced?.missing || []).map((s, i) => (
                          <span key={i} className="text-xs font-bold bg-white dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-lg text-rose-700 dark:text-rose-400">{s}</span>
                        ))}
                        {(analysis?.skillGap?.advanced?.missing || []).length === 0 && <span className="text-xs text-slate-500 italic">No missing advanced skills!</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-12 text-center">
                <Brain size={32} className="mx-auto text-blue-500 mb-3 animate-pulse" />
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Features for Enrolled Students Only</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">Please log in with an FPT student account to view personalized skill gap audits.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PORTFOLIO GENERATOR */}
        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderGit2 size={18} className="text-blue-500" /> Recommended Projects for {career.careerName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(career.portfolios || []).map((p, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</h4>
                      <div className="flex flex-wrap gap-1">
                        {(p.learnToApply || []).map((tech, ti) => (
                          <span key={ti} className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-500">{tech}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generator Section (Student only) */}
              {mode === 'STUDENT' && (
                <div className="glass-card rounded-2xl border border-blue-200 dark:border-blue-500/20 p-6 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-blue-500" /> AI Portfolio Generator
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Our AI analyzes your missing roadmap skills and devises a tailored project idea that maximizes your portfolio readiness.</p>
                  </div>

                  <button
                    onClick={handleGenerateProject}
                    disabled={generating}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating portfolio specs...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Generate Tailored Project Spec
                      </>
                    )}
                  </button>

                  {generatedProject && (
                    <div className="border border-blue-200 dark:border-blue-500/20 rounded-xl bg-white dark:bg-slate-950 p-5 space-y-4 animate-fadeIn">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">{generatedProject.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{generatedProject.description}</p>
                        </div>
                        <span className="text-xs font-black px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-500 whitespace-nowrap">
                          +{generatedProject.boost}% Readiness
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Stack details:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {generatedProject.techStack.map((tech, i) => (
                            <span key={i} className="text-xs font-extrabold px-2 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-300">{tech}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Main Features to build:</span>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pl-4 list-disc">
                          {generatedProject.features.map((feature, i) => (
                            <li key={i}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Why build a portfolio?</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tech recruiters value actual, verified code outputs far more than grade cards. A repository demonstrates:
                </p>
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Real understanding of backend/frontend setups.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Experience with Git workflows, code hygiene, and project readme files.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: 90-DAY PLAN */}
        {activeTab === 'plan90' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" /> Personalized 90-Day Learning Plan
              </h3>
              <p className="text-xs text-slate-500 mt-1">A week-by-week blueprint structured dynamically to cover your remaining roadmap tasks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weeklyPlan.map((p, i) => (
                <div key={i} className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4 hover:border-blue-500/25 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                    <span className="text-xs font-black text-blue-500 uppercase tracking-widest">{p.weeks}</span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Clock size={10} /> {p.duration}</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{p.title}</h4>
                    <p className="text-xs text-slate-500">{p.action}</p>
                  </div>

                  {p.skills.length > 0 && (
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Focus:</span>
                      <div className="flex flex-wrap gap-1">
                        {p.skills.map((s, si) => (
                          <span key={si} className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: ACTION PLAN */}
        {activeTab === 'action' && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Top 5 Action Items */}
            <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Rocket size={18} className="text-blue-500" /> Quick-Win Action Items
                </h3>
                <p className="text-xs text-slate-500 mt-1">Implement these top actions to boost your match scores and readiness levels.</p>
              </div>

              <div className="space-y-3">
                {analysis.topMissingSkills?.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 group hover:border-blue-300 dark:hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 text-xs font-black">{i + 1}</span>
                      <div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Acquire skill {s.skill}</span>
                        <span className="text-[10px] text-slate-500 block">Missing core roadmap requirement</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
                      +{s.gainedReadiness || 10} Pts
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 group hover:border-blue-300 dark:hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 text-xs font-black">4</span>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Submit GitHub Project Evidence</span>
                      <span className="text-[10px] text-slate-500 block">Practicing skills in real codebases</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
                    +7 Pts
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 group hover:border-blue-300 dark:hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 text-xs font-black">5</span>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Boost Attendance & Participation</span>
                      <span className="text-[10px] text-slate-500 block">Raises Behavior Index</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
                    +3 Pts
                  </span>
                </div>
              </div>
            </div>

            {/* Score breakdown & Forecast */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Readiness Score Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Academic (School Courses)', val: Math.round((computedMetrics.academicScore / 100) * 30), max: 30, desc: 'Calculated from completed prerequisite courses.' },
                    { label: 'Industry Skills (Roadmap)', val: Math.round((computedMetrics.industryScore / 100) * 40), max: 40, desc: 'Calculated from completed roadmap capabilities.' },
                    { label: 'Portfolio (Project Evidence)', val: Math.round((computedMetrics.portfolioScore / 100) * 20), max: 20, desc: 'Calculated from uploaded GitHub repositories.' },
                    { label: 'Behavior (Participation)', val: Math.round((computedMetrics.behaviorScore / 100) * 10), max: 10, desc: 'Calculated from class attendance logs.' },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1 pb-2 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{item.label}</span>
                        <span>{item.val}/{item.max}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {computedMetrics.forecasts.length > 0 && (
                <div className="glass-card rounded-2xl border border-emerald-200 dark:border-emerald-500/20 p-6 bg-emerald-500/5 text-center space-y-2">
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Projected Readiness Forecast</h3>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {Math.min(100, computedMetrics.readinessScore + computedMetrics.forecasts.reduce((sum, f) => sum + f.points, 0))}/100
                  </div>
                  <p className="text-[11px] text-slate-500">Completing the next goals on your timeline will increase your level to:</p>
                  <span className="inline-block px-3 py-1 bg-emerald-500 text-white font-extrabold text-xs rounded-lg">
                    {getReadinessConfig(Math.min(100, computedMetrics.readinessScore + computedMetrics.forecasts.reduce((sum, f) => sum + f.points, 0))).label}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* EVIDENCE SUBMISSION MODAL */}
      {evidenceModalTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 animate-scaleUp">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award size={18} className="text-emerald-500" /> Learning Evidence Submission
              </h3>
              <p className="text-xs text-slate-500 mt-1">Provide evidence of practicing **{evidenceModalTask.title}** to boost your Portfolio score.</p>
            </div>

            <form onSubmit={handleSubmitEvidence} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">GitHub Repository (Required)</label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/username/project"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Live Demo / YouTube URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://my-demo-app.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Screenshot URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://imgur.com/my-screenshot.png"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2 justify-end text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEvidenceModalTask(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteWithoutEvidence}
                  className="px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5 cursor-pointer"
                >
                  Complete without Evidence
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  Confirm & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
