import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, AlertTriangle, BookOpen, Terminal, User, Hash, Trash2, HelpCircle, ArrowRight, MessageSquare, ShieldAlert, Plus, ChevronDown, Bookmark, Share, ArrowUp, Search, Loader2, X, PanelLeftClose, PanelLeft, Edit3, Check } from 'lucide-react';
import { useStore } from '../store';
import { api } from '../lib/api';
import GPATrendChart from '../components/charts/GPATrendChart';
import RiskBreakdownChart from '../components/charts/RiskBreakdownChart';
import AttendanceChart from '../components/charts/AttendanceChart';

export default function AIChat() {
  const activeStudent = useStore(state => state.activeStudent);
  const setActiveStudent = useStore(state => state.setActiveStudent);
  const currentUser = useStore(state => state.currentUser);
  
  // Collapse state for Sidebar (persisted in localStorage to keep user preference)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('eduguard_chat_sidebar_open');
    return saved !== 'false'; // Default to true if not set or if set to true
  });

  // Toast notification state for rich visual feedback
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Show toast utility function
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3500);
  };

  // Persist sidebarOpen changes to localStorage
  useEffect(() => {
    localStorage.setItem('eduguard_chat_sidebar_open', sidebarOpen);
  }, [sidebarOpen]);

  // Rename Session states
  const [renamingId, setRenamingId] = useState(null);
  const [newTitleVal, setNewTitleVal] = useState('');

  // 1. Load Sessions from localStorage or set defaults
  const [sessions, setSessions] = useState(() => {
    const userId = currentUser?.id || 'guest';
    const saved = localStorage.getItem(`eduguard_chat_sessions_${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing chat sessions:', e);
      }
    }
    
    // Default initial session
    const defaultSessionId = 'session_' + Date.now();
    const isStudent = currentUser?.role === 'STUDENT';
    const defaultWelcomeText = isStudent
      ? `👋 Xin chào ${currentUser?.name || 'bạn'}! Tôi là Academic NLP Assistant của hệ thống EduGuard, được phân quyền truy cập trên dữ liệu học thuật của riêng bạn.\n\nTôi đã kết nối trực tiếp với học bạ của bạn. Bạn có thể đặt câu hỏi về điểm số, môn học rủi ro, hoặc yêu cầu hệ thống xuất báo cáo phương pháp, lộ trình cải thiện kết quả học tập nhé!`
      : '👋 Xin chào! Tôi là NLP Assistant của hệ thống EduGuard, được kết nối với cơ sở dữ liệu học thuật của nhà trường.\n\nTôi có thể hỗ trợ gì cho giảng viên hôm nay? Bạn có thể nhập truy vấn tự do hoặc nhấn chọn các phím tắt phân tích nhanh ở cột bên dưới nhé!';

    return [
      {
        id: defaultSessionId,
        title: 'Hội thoại mới',
        activeStudent: null,
        messages: [
          {
            sender: 'ai',
            text: defaultWelcomeText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ],
        provider: 'gemini',
        proMode: false,
        bookmarked: false,
        createdAt: new Date().toISOString()
      }
    ];
  });

  // 2. Active Session ID state
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const userId = currentUser?.id || 'guest';
    const savedActive = localStorage.getItem(`eduguard_active_session_id_${userId}`);
    if (savedActive) {
      return savedActive;
    }
    return sessions[0]?.id || '';
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Interactive Student Search states (Inline Popover)
  const [showInlineSearch, setShowInlineSearch] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inlineSearchRef = useRef(null);
  const prevActiveStudentRef = useRef(activeStudent);

  // Derived Active Session Values
  const activeSession = sessions.find(s => s.id === currentSessionId) || sessions[0] || {};
  const messages = activeSession.messages || [];
  const sessionActiveStudent = activeSession.activeStudent || null;
  const provider = activeSession.provider || 'gemini';
  const proMode = activeSession.proMode || false;
  const bookmarked = activeSession.bookmarked || false;

  // Save active session ID to localStorage on change
  useEffect(() => {
    if (currentSessionId && currentUser?.id) {
      localStorage.setItem(`eduguard_active_session_id_${currentUser.id}`, currentSessionId);
    }
  }, [currentSessionId, currentUser]);

  // Helper to update active session fields in state and localStorage
  const updateActiveSession = (fields) => {
    const userId = currentUser?.id || 'guest';
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === currentSessionId) {
          const merged = { ...s, ...fields };
          // Auto-generate title if default and there are user messages
          if (merged.title === 'Hội thoại mới' || merged.title === 'Cuộc hội thoại mới') {
            const firstUser = merged.messages.find(m => m.sender === 'user');
            if (firstUser) {
              merged.title = firstUser.text.slice(0, 24) + (firstUser.text.length > 24 ? '...' : '');
            } else if (merged.activeStudent) {
              merged.title = currentUser?.role === 'STUDENT' ? 'Cố vấn cá nhân' : `🔗 ${merged.activeStudent.name}`;
            }
          }
          return merged;
        }
        return s;
      });
      localStorage.setItem(`eduguard_chat_sessions_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Close inline search popup on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inlineSearchRef.current && !inlineSearchRef.current.contains(event.target)) {
        setShowInlineSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time search handler for RAG Student Selector
  useEffect(() => {
    if (!studentSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchingStudents(true);
      try {
        const res = await api.get(`/students-search?q=${encodeURIComponent(studentSearchQuery)}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Lỗi tìm kiếm sinh viên:', err);
      } finally {
        setSearchingStudents(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [studentSearchQuery]);

  // Auto-load personal student profile for STUDENT role
  useEffect(() => {
    const initStudentProfile = async () => {
      if (currentUser?.role === 'STUDENT' && currentUser?.id) {
        try {
          if (!activeStudent || activeStudent.id !== currentUser.id) {
            const res = await api.get(`/students/${currentUser.id}`);
            const studentDetail = res.data;
            setActiveStudent(studentDetail);
          }
        } catch (err) {
          console.error("Lỗi khi tự động tải học bạ cá nhân sinh viên:", err);
        }
      }
    };
    initStudentProfile();
  }, [currentUser, activeStudent, setActiveStudent]);

  // Force-bind session student context for students
  useEffect(() => {
    if (currentUser?.role === 'STUDENT' && activeStudent) {
      const alreadyLinked = sessionActiveStudent?.id === activeStudent.id || sessionActiveStudent?.mssv === activeStudent.id;
      if (!alreadyLinked) {
        updateActiveSession({ activeStudent: activeStudent });
      }
    }
  }, [currentUser, activeStudent, sessionActiveStudent, currentSessionId]);

  // Sanitize student sessions to replace any Lecturer-oriented welcome message in local history
  useEffect(() => {
    if (currentUser?.role === 'STUDENT' && sessions.length > 0) {
      const defaultStudentWelcome = `👋 Xin chào ${currentUser?.name || 'bạn'}! Tôi là Academic NLP Assistant của hệ thống EduGuard, được phân quyền truy cập trên dữ liệu học thuật của riêng bạn.\n\nTôi đã kết nối trực tiếp với học bạ của bạn. Bạn có thể đặt câu hỏi về điểm số, môn học rủi ro, hoặc yêu cầu hệ thống xuất báo cáo phương pháp, lộ trình cải thiện kết quả học tập nhé!`;
      
      let changed = false;
      const updated = sessions.map(s => {
        if (s.messages && s.messages.length > 0 && s.messages[0].sender === 'ai') {
          const firstMsgText = s.messages[0].text;
          if (firstMsgText.includes('giảng viên') || firstMsgText.includes('Thầy/Cô') || firstMsgText.includes('kết nối trực tiếp với học bạ') === false) {
            changed = true;
            return {
              ...s,
              messages: [
                {
                  ...s.messages[0],
                  text: defaultStudentWelcome
                },
                ...s.messages.slice(1)
              ]
            };
          }
        }
        return s;
      });

      if (changed) {
        setSessions(updated);
        localStorage.setItem(`eduguard_chat_sessions_${currentUser.id}`, JSON.stringify(updated));
      }
    }
  }, [currentUser, sessions]);

  // Track global activeStudent store updates (e.g. from header search or inline click)
  useEffect(() => {
    if (activeStudent && activeStudent?.id !== prevActiveStudentRef.current?.id) {
      const isStudent = currentUser?.role === 'STUDENT';
      const welcomeContext = {
        sender: 'ai',
        text: isStudent
          ? `🔮 **ĐÃ LIÊN KẾT: Đang mở học bạ cá nhân của bạn**\n\nTôi đã nạp toàn bộ lịch sử điểm số thực tế từ cơ sở dữ liệu. Bạn có thể hỏi tôi:\n• *Đánh giá chi tiết năng lực học thuật của tôi?*\n• *Lộ trình cải thiện GPA và môn có nguy cơ trượt của tôi?*\n• *Đề xuất phương pháp học tập hiệu quả giúp tôi nâng cao kết quả?*`
          : `🔮 **ĐÃ LIÊN KẾT: Đang mở học bạ sinh viên ${activeStudent.name} (${activeStudent.mssv || activeStudent.id})**\n\nTôi đã nạp toàn bộ lịch sử điểm số thực tế từ cơ sở dữ liệu. Giảng viên có thể hỏi tôi:\n• *Đánh giá chi tiết năng lực học thuật của em ấy?*\n• *Môn học kỳ mới dự báo trượt cao và đề xuất phụ đạo?*\n• *Soạn tin nhắn Zalo gửi sinh viên cảnh báo nhẹ nhàng?*`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      const alreadyLinked = sessionActiveStudent?.id === activeStudent.id || sessionActiveStudent?.mssv === activeStudent.id;
      if (!alreadyLinked) {
        updateActiveSession({
          activeStudent: activeStudent,
          messages: [...messages, welcomeContext]
        });
      }
    }
    prevActiveStudentRef.current = activeStudent;
  }, [activeStudent, currentUser]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectStudent = async (student) => {
    setSearchingStudents(true);
    try {
      const res = await api.get(`/students/${student.id}`);
      const studentDetail = res.data;
      
      const welcomeContext = {
        sender: 'ai',
        text: `🔮 **ĐÃ LIÊN KẾT: Đang mở học bạ sinh viên ${studentDetail.name} (${studentDetail.mssv || studentDetail.id})**\n\nTôi đã nạp toàn bộ lịch sử điểm số thực tế từ cơ sở dữ liệu. Giảng viên có thể hỏi tôi:\n• *Đánh giá chi tiết năng lực học thuật của em ấy?*\n• *Môn học kỳ mới dự báo trượt cao và đề xuất phụ đạo?*\n• *Soạn tin nhắn Zalo gửi sinh viên cảnh báo nhẹ nhàng?*`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      updateActiveSession({
        activeStudent: studentDetail,
        messages: [...messages, welcomeContext]
      });
      
      setActiveStudent(studentDetail);
      setStudentSearchQuery('');
      setSearchResults([]);
      setShowInlineSearch(false);
      showToast(`🔗 Đã liên kết học bạ sinh viên ${studentDetail.name}!`, 'success');
    } catch (err) {
      alert('Không thể tải chi tiết sinh viên: ' + (err.response?.data?.error || err.message));
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleCreateSession = () => {
    const userId = currentUser?.id || 'guest';
    const newId = 'session_' + Date.now();
    const isStudent = currentUser?.role === 'STUDENT';
    const defaultWelcomeText = isStudent
      ? `👋 Xin chào ${currentUser?.name || 'bạn'}! Tôi là Academic NLP Assistant của hệ thống EduGuard, được phân quyền truy cập trên dữ liệu học thuật của riêng bạn.\n\nTôi đã kết nối trực tiếp với học bạ của bạn. Bạn có thể đặt câu hỏi về điểm số, môn học rủi ro, hoặc yêu cầu hệ thống xuất báo cáo phương pháp, lộ trình cải thiện kết quả học tập nhé!`
      : '👋 Xin chào! Tôi là NLP Assistant của hệ thống EduGuard, được kết nối với cơ sở dữ liệu học thuật của nhà trường.\n\nTôi có thể hỗ trợ gì cho giảng viên hôm nay? Bạn có thể nhập truy vấn tự do hoặc nhấn chọn các phím tắt phân tích nhanh ở cột bên dưới nhé!';

    const newSession = {
      id: newId,
      title: 'Hội thoại mới',
      activeStudent: isStudent ? activeStudent : null,
      messages: [
        {
          sender: 'ai',
          text: defaultWelcomeText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      provider: 'gemini',
      proMode: false,
      bookmarked: false,
      createdAt: new Date().toISOString()
    };
    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem(`eduguard_chat_sessions_${userId}`, JSON.stringify(updated));
      return updated;
    });
    setCurrentSessionId(newId);
    localStorage.setItem(`eduguard_active_session_id_${userId}`, newId);
    showToast('🎉 Đã lưu hội thoại cũ vào Lịch sử và bắt đầu phiên mới!', 'success');
  };

  const handleSendToStudent = async (text) => {
    if (!sessionActiveStudent) {
      alert("Bạn chưa liên kết học bạ của Sinh viên nào với cuộc trò chuyện này!");
      return;
    }
    if (!currentUser) return;
    
    try {
      await api.post('/comm/messages', {
        senderId: currentUser.id,
        receiverId: sessionActiveStudent.mssv || sessionActiveStudent.id,
        content: text
      });
      showToast('📤 Đã gửi lộ trình trực tiếp vào Hộp thư của Sinh viên thành công!', 'success');
    } catch (err) {
      alert("Lỗi khi gửi tin nhắn: " + err.message);
    }
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      alert('Hệ thống yêu cầu giữ lại ít nhất một cuộc hội thoại!');
      return;
    }
    const userId = currentUser?.id || 'guest';
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      localStorage.setItem(`eduguard_chat_sessions_${userId}`, JSON.stringify(filtered));
      
      if (currentSessionId === id) {
        const nextActive = filtered[0]?.id || '';
        setCurrentSessionId(nextActive);
        localStorage.setItem(`eduguard_active_session_id_${userId}`, nextActive);
      }
      return filtered;
    });
    showToast('🗑️ Đã xóa cuộc hội thoại thành công!', 'info');
  };

  const startRename = (id, title, e) => {
    e.stopPropagation();
    setRenamingId(id);
    setNewTitleVal(title);
  };

  const saveRename = (id, e) => {
    if (e) e.stopPropagation();
    if (!newTitleVal.trim()) {
      setRenamingId(null);
      return;
    }
    const userId = currentUser?.id || 'guest';
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === id) {
          return { ...s, title: newTitleVal.trim() };
        }
        return s;
      });
      localStorage.setItem(`eduguard_chat_sessions_${userId}`, JSON.stringify(updated));
      return updated;
    });
    setRenamingId(null);
    showToast('✏️ Đã cập nhật tên cuộc hội thoại!', 'success');
  };

  const handleSend = async (textToSend) => {
    if (loading) return;
    const msgText = textToSend || input;
    if (!msgText.trim()) return;

    const userMsg = {
      sender: 'user',
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const updatedMessages = [...messages, userMsg];
    updateActiveSession({ messages: updatedMessages });
    
    if (!textToSend) setInput('');
    setLoading(true);

    const historyPayload = updatedMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Apply premium Pro Mode instruction if checked
    const finalMessage = proMode 
      ? `[Chế độ Cố vấn Chuyên sâu bậc cao] ${msgText}` 
      : msgText;

    try {
      const res = await api.post('/chat', {
        sessionId: currentSessionId,
        message: finalMessage,
        studentContext: sessionActiveStudent,
        provider: provider,
        history: historyPayload.slice(0, -1)
      });
      const aiReply = {
        sender: 'ai',
        text: res.data.reply || 'Rất tiếc, tôi đang gặp lỗi xử lý dữ liệu học tập.',
        chartData: res.data.chartData || null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateActiveSession({ messages: [...updatedMessages, aiReply] });
    } catch (err) {
      const errorReply = {
        sender: 'ai',
        text: '❌ Không thể kết nối với API Gateway. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateActiveSession({ messages: [...updatedMessages, errorReply] });
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = () => {
    const newBookmarked = !bookmarked;
    updateActiveSession({ bookmarked: newBookmarked });
    showToast(newBookmarked ? '⭐ Đã thêm cuộc hội thoại vào mục lưu trữ!' : '⭐ Đã bỏ lưu trữ cuộc hội thoại!', 'success');
  };

  const handleExport = () => {
    const userRoleText = currentUser?.role === 'STUDENT' ? 'Sinh viên' : 'Giảng viên';
    const textToExport = messages.map(m => `${m.sender === 'user' ? userRoleText : 'NLP Analytics Engine'} (${m.time}):\n${m.text}`).join('\n\n');
    const blob = new Blob([textToExport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eduguard_ai_report_${sessionActiveStudent ? sessionActiveStudent.mssv : 'general'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('📥 Đã xuất báo cáo hội thoại dạng tệp tin!', 'success');
  };

  // Helper to parse inline bold styles (**text**)
  const parseInlineStyles = (text) => {
    if (!text) return '';
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="text-white font-extrabold">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  // High-fidelity rendering parser for texts, bullet points, and markdown tables block-by-block
  const formatText = (text) => {
    if (!text) return '';
    
    const lines = text.split('\n');
    const elements = [];
    let currentTable = null;
    let currentList = null;
    
    const flushList = (key) => {
      if (currentList && currentList.length > 0) {
        elements.push(
          <ul key={key} className="list-disc pl-6 mb-4 space-y-1.5 mt-1">
            {currentList}
          </ul>
        );
        currentList = null;
      }
    };
    
    const flushTable = (key) => {
      if (currentTable) {
        elements.push(
          <div key={key} className="overflow-x-auto my-4 rounded-2xl border border-white/10 bg-slate-950/40 shadow-xl max-w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  {currentTable.headers.map((h, idx) => (
                    <th key={idx} className="p-3 font-extrabold text-white uppercase tracking-wider">{parseInlineStyles(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentTable.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 text-slate-300 font-medium">{parseInlineStyles(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        currentTable = null;
      }
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 1. Detect and parse Markdown Tables
      if (line.startsWith('|')) {
        flushList(`list-${i}`);
        
        const cells = line.split('|')
          .map(c => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          
        const isSeparator = cells.every(c => c.startsWith('-') || c === '');
        
        if (isSeparator) {
          continue;
        }
        
        if (!currentTable) {
          currentTable = { headers: cells, rows: [] };
        } else {
          currentTable.rows.push(cells);
        }
        continue;
      } else {
        flushTable(`table-${i}`);
      }
      
      // 2. Detect and parse List items (bullets)
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        const cleanContent = line.replace(/^[•\-*]\s*/, '');
        const parsedContent = parseInlineStyles(cleanContent);
        
        if (!currentList) {
          currentList = [];
        }
        currentList.push(
          <li key={`li-${i}`} className="text-slate-300 leading-relaxed text-sm font-medium">
            {parsedContent}
          </li>
        );
        continue;
      } else {
        flushList(`list-${i}`);
      }
      
      // 3. Headers
      if (line.startsWith('### ')) {
        const text = line.replace('### ', '');
        elements.push(
          <h4 key={`h4-${i}`} className="text-lg font-bold text-white mt-4 mb-2">
            {parseInlineStyles(text)}
          </h4>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        const text = line.replace('## ', '');
        elements.push(
          <h3 key={`h3-${i}`} className="text-xl font-bold text-white mt-5 mb-3 border-b border-white/10 pb-2">
            {parseInlineStyles(text)}
          </h3>
        );
        continue;
      }
      if (line.startsWith('# ')) {
        const text = line.replace('# ', '');
        elements.push(
          <h2 key={`h2-${i}`} className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mt-6 mb-4">
            {parseInlineStyles(text)}
          </h2>
        );
        continue;
      }
      
      // 4. Regular text paragraph
      if (line === '') {
        continue;
      }
      
      const parsedContent = parseInlineStyles(line);
      elements.push(
        <p key={`p-${i}`} className="mb-3 text-slate-300 leading-relaxed text-sm font-medium">
          {parsedContent}
        </p>
      );
    }
    
    flushList('list-final');
    flushTable('table-final');
    
    return elements;
  };

  // Group Sessions by date helper
  const groupedSessions = (() => {
    const today = [];
    const thisWeek = [];
    const older = [];
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    
    sessions.forEach(s => {
      const time = new Date(s.createdAt || Date.now()).getTime();
      if (time >= startOfToday) {
        today.push(s);
      } else if (time >= oneWeekAgo) {
        thisWeek.push(s);
      } else {
        older.push(s);
      }
    });
    
    return { today, thisWeek, older };
  })();

  const isStudent = currentUser?.role === 'STUDENT';

  // Dynamic shortcuts display row above input capsule
  const currentPills = isStudent
    ? [
        { text: 'Hãy đánh giá chi tiết học lực hiện tại của tôi?', label: '📊 Đánh giá học lực', icon: <User size={12} className="text-blue-400" /> },
        { text: 'Hãy tự động soạn Lộ trình học và bài tập để cải thiện kết quả học tập của tôi?', label: '📝 Lộ trình học & Bài tập', icon: <BookOpen size={12} className="text-emerald-400" /> },
        { text: 'Hãy chỉ ra các môn tôi có nguy cơ trượt cao trong học kỳ mới và đánh giá mức độ khẩn cấp?', label: '🔥 Đánh giá rủi ro', icon: <ShieldAlert size={12} className="text-rose-400" /> },
        { text: 'Đề xuất phương pháp học tập hiệu quả giúp tôi nâng cao kết quả học tập?', label: '💡 Đề xuất phương pháp', icon: <Sparkles size={12} className="text-purple-400" /> }
      ]
    : sessionActiveStudent 
      ? [
          { text: 'Hãy đánh giá chi tiết học lực hiện tại của sinh viên này?', label: '📊 Đánh giá học lực', icon: <User size={12} className="text-blue-400" /> },
          { text: 'Hãy phân tích lỗ hổng tiên quyết và tự động soạn Lộ trình học/bài tập bổ trợ để tôi gửi sinh viên?', label: '📝 Soạn Lộ trình học/Bài tập', icon: <BookOpen size={12} className="text-emerald-400" /> },
          { text: 'Tóm tắt trọng tâm lý thuyết cốt lõi của môn học tiên quyết mà sinh viên này đang bị hổng?', label: '🧠 Tóm tắt Lý thuyết hổng', icon: <Sparkles size={12} className="text-purple-400" /> },
          { text: 'Soạn hộ một mẫu tin nhắn Zalo kèm lộ trình can thiệp gửi sinh viên nhẹ nhàng, tinh tế?', label: '💬 Soạn tin Zalo/Email', icon: <MessageSquare size={12} className="text-amber-400" /> },
          { text: 'Hãy chỉ ra các môn có nguy cơ trượt cao trong học kỳ mới và đánh giá mức độ khẩn cấp?', label: '🔥 Đánh giá rủi ro', icon: <ShieldAlert size={12} className="text-rose-400" /> }
        ]
      : [
          { text: 'Môn nào dễ trượt nhất hệ thống?', label: '🔥 Top môn dễ trượt', icon: <AlertTriangle size={12} className="text-rose-400" /> },
          { text: 'Thống kê danh sách sinh viên học lực yếu có nguy cơ cao?', label: '⚠️ Cảnh báo sinh viên yếu', icon: <Bot size={12} className="text-purple-400" /> },
          { text: 'Mô hình phân tích chuỗi môn học tiên quyết hoạt động như thế nào?', label: '📐 Knowledge Graph', icon: <Terminal size={12} className="text-cyan-400" /> },
          { text: 'Tổng quan chương trình đào tạo FPT có tổng cộng bao nhiêu môn học?', label: '📚 Chương trình đào tạo', icon: <BookOpen size={12} className="text-emerald-400" /> }
        ];


  const renderSessionItem = (session) => {
    const isActive = session.id === currentSessionId;
    const isRenaming = session.id === renamingId;
    
    if (isRenaming) {
      return (
        <div key={session.id} className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
          <form 
            onSubmit={(e) => { e.preventDefault(); saveRename(session.id); }} 
            className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-xl border border-blue-500/30"
          >
            <input 
              type="text" 
              value={newTitleVal} 
              onChange={(e) => setNewTitleVal(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-100 text-xs w-full font-medium"
              autoFocus
              onBlur={() => saveRename(session.id)}
            />
            <button type="submit" className="text-green-400 hover:text-green-300 p-0.5 cursor-pointer"><Check size={12} /></button>
            <button type="button" onClick={() => setRenamingId(null)} className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"><X size={12} /></button>
          </form>
        </div>
      );
    }

    return (
      <div
        key={session.id}
        onClick={() => setCurrentSessionId(session.id)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border transition-all text-xs cursor-pointer group ${
          isActive 
            ? 'border-blue-500/25 bg-blue-500/10 text-blue-300 font-bold shadow-[0_0_15px_rgba(59,130,246,0.06)]' 
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 font-semibold'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <MessageSquare size={13} className={isActive ? "text-blue-400 flex-shrink-0 animate-pulse" : "text-slate-500 flex-shrink-0"} />
          <span className="truncate pr-1">{session.title}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button 
            onClick={(e) => startRename(session.id, session.title, e)} 
            className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-blue-400 transition-colors cursor-pointer" 
            title="Đổi tên"
          >
            <Edit3 size={11} />
          </button>
          <button 
            onClick={(e) => handleDeleteSession(session.id, e)} 
            className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer" 
            title="Xóa"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="w-full h-[calc(100vh-9.5rem)] flex glass-card rounded-[32px] border border-white/10 overflow-hidden relative shadow-2xl animate-fade-in bg-slate-900/40"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      {/* Dynamic Background glows */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* 1. Left Sidebar - Collapsible Session History */}
      <div 
        className={`h-full border-r border-white/10 flex flex-col bg-slate-950/40 backdrop-blur-2xl transition-all duration-300 relative z-30 overflow-hidden ${
          sidebarOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 pointer-events-none border-r-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            Lịch sử trò chuyện
          </h4>
          <button
            onClick={handleCreateSession}
            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-400/40 rounded-lg text-blue-300 transition-all cursor-pointer shadow-sm"
            title="Tạo hội thoại mới"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Scrollable Session List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar bg-slate-950/10">
          {/* Today Group */}
          {groupedSessions.today.length > 0 && (
            <div>
              <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 px-3.5 mb-1.5">
                Hôm nay
              </div>
              <div className="space-y-1">
                {groupedSessions.today.map(renderSessionItem)}
              </div>
            </div>
          )}

          {groupedSessions.thisWeek.length > 0 && (
            <div>
              <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 px-3.5 mb-1.5">
                Tuần này
              </div>
              <div className="space-y-1">
                {groupedSessions.thisWeek.map(renderSessionItem)}
              </div>
            </div>
          )}

          {groupedSessions.older.length > 0 && (
            <div>
              <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 px-3.5 mb-1.5">
                Cũ hơn
              </div>
              <div className="space-y-1">
                {groupedSessions.older.map(renderSessionItem)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Side - Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        
        {/* Header Workspace Area */}
        <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-slate-950/20 relative z-20">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer mr-1"
              title={sidebarOpen ? "Ẩn thanh lịch sử" : "Hiện thanh lịch sử"}
            >
              {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg border border-white/10 shadow-blue-500/20">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                {currentUser?.role === 'STUDENT' ? 'Academic NLP Assistant' : 'Hệ thống Phân tích Học vụ (DSS)'} <Sparkles size={14} className="text-amber-400 animate-pulse" />
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                {currentUser?.role === 'STUDENT'
                  ? 'Học bạ cá nhân và Báo cáo Analytics'
                  : sessionActiveStudent 
                    ? `Đang cố vấn cho sinh viên ${sessionActiveStudent.name} (${sessionActiveStudent.mssv || sessionActiveStudent.id})` 
                    : 'Phân tích dữ liệu học thuật & liên kết học bạ thông minh'}
              </p>
            </div>
          </div>

          {/* Header Right: Controls & Linking Badge */}
          <div className="flex items-center gap-3 relative" ref={inlineSearchRef}>
            {/* Direct header "Hội thoại mới" button for instant UX access */}
            <button
              onClick={handleCreateSession}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-400/40 rounded-full text-[11px] text-blue-300 font-bold transition-all cursor-pointer shadow-sm group"
              title="Bắt đầu cuộc hội thoại mới"
            >
              <Plus size={11} className="text-blue-400 group-hover:rotate-90 transition-transform duration-300" />
              <span>Hội thoại mới</span>
            </button>

            {currentUser?.role === 'STUDENT' ? (
              /* Static capsule for students - non-clickable, no X button */
              <div 
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[11px] text-purple-300 font-bold shadow-sm"
                title="Học bạ cá nhân của bạn"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                <span>🔗 Học bạ cá nhân: {sessionActiveStudent?.name || currentUser?.name || 'Cá nhân'}</span>
              </div>
            ) : sessionActiveStudent ? (
              <div className="flex items-center gap-2">
                {/* Linked student capsule */}
                <div 
                  onClick={() => setShowInlineSearch(!showInlineSearch)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/20 hover:border-purple-400/40 rounded-full text-[11px] text-purple-300 font-bold hover:bg-purple-500/15 transition-all cursor-pointer shadow-sm group"
                  title="Thay đổi liên kết học bạ"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
                  <span>🔗 {sessionActiveStudent.name}</span>
                  <ChevronDown size={11} className="text-purple-400 group-hover:translate-y-0.5 transition-transform" />
                </div>

                {/* Clear student button */}
                <button
                  onClick={() => {
                    updateActiveSession({ activeStudent: null });
                    setActiveStudent(null);
                    setShowInlineSearch(false);
                    showToast('🔓 Đã hủy liên kết học bạ sinh viên!', 'info');
                  }}
                  className="p-1.5 bg-rose-500/10 border border-rose-500/20 hover:border-rose-400/40 rounded-full text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                  title="Hủy liên kết học sinh"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              /* Link Student Action Trigger */
              <div
                onClick={() => setShowInlineSearch(!showInlineSearch)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/20 rounded-full text-[11px] text-slate-300 hover:text-blue-300 font-bold transition-all cursor-pointer shadow-sm group"
              >
                <Search size={11} className="text-slate-400 group-hover:text-blue-400" />
                <span>Liên kết học bạ học sinh</span>
                <ChevronDown size={11} className="text-slate-500 group-hover:translate-y-0.5 transition-transform" />
              </div>
            )}

            {/* Floating Student Search popover dropdown overlay */}
            {showInlineSearch && currentUser?.role !== 'STUDENT' && (
              <div className="absolute top-full right-0 mt-2.5 w-80 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-30 p-3 flex flex-col gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Nhập MSSV hoặc tên sinh viên..."
                    className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
                    autoFocus
                  />
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  {searchingStudents && (
                    <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
                  )}
                </div>

                {searchResults.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto divide-y divide-white/5 mt-1 custom-scrollbar">
                    {searchResults.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleSelectStudent(st)}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-white/5 rounded-lg text-left transition-all text-xs text-slate-200"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-100 truncate">{st.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{st.id} • {st.classCode || 'WD18301'}</p>
                        </div>
                        <ArrowRight size={11} className="text-slate-500" />
                      </button>
                    ))}
                  </div>
                ) : studentSearchQuery.trim() ? (
                  <p className="text-[10px] text-slate-500 text-center py-3">Không tìm thấy sinh viên</p>
                ) : (
                  <p className="text-[10px] text-slate-500 text-center py-3">Nhập MSSV hoặc tên để tìm kiếm...</p>
                )}
              </div>
            )}

            {/* Connected state dot */}
            <div className="h-6 w-px bg-white/5 hidden md:block"></div>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[9px] text-green-400 font-extrabold uppercase tracking-wider">Hệ thống sẵn sàng</span>
            </div>
          </div>
        </div>

        {/* Messages thread history area - Full width */}
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 custom-scrollbar relative z-10 bg-slate-950/10">
          <div className="max-w-6xl mx-auto w-full space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-4 max-w-[92%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white border flex-shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 border-blue-500/20 shadow-md'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 border-purple-500/20 shadow-md'
                }`}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>

                <div className="space-y-1 max-w-[95%] flex-1">
                  <div
                    className={
                      msg.sender === 'user'
                        ? 'p-4 rounded-3xl rounded-tr-none text-sm shadow-md border bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/25 ml-auto w-fit max-w-[85%]'
                        : 'p-0 bg-transparent border-none shadow-none text-slate-200 max-w-none text-sm'
                    }
                  >
                    {msg.sender === 'ai' ? (
                      <div className="prose prose-invert prose-sm max-w-none relative group pb-2">
                        {formatText(msg.text)}
                        {msg.chartData && (
                          <div className="mt-4 mb-2 bg-slate-950/40 p-4 rounded-xl border border-white/10 w-[500px] max-w-full overflow-x-auto">
                            {msg.chartData.type === 'gpa' && <GPATrendChart data={msg.chartData.data} />}
                            {msg.chartData.type === 'risk' && <RiskBreakdownChart data={msg.chartData.data} />}
                            {msg.chartData.type === 'attendance' && <AttendanceChart data={msg.chartData.data} />}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
                          <button onClick={() => setInput('Xem Risk Score')} className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-[10px] font-bold rounded text-slate-400 hover:text-blue-300 transition-all">Xem Risk Score</button>
                          <button onClick={() => setInput('Môn nào dễ rớt')} className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-[10px] font-bold rounded text-slate-400 hover:text-blue-300 transition-all">Phân tích môn yếu</button>
                          <button onClick={() => setInput('Đề xuất lộ trình')} className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-[10px] font-bold rounded text-slate-400 hover:text-blue-300 transition-all">Đề xuất lộ trình</button>
                          <button onClick={() => setInput('Tình trạng chuyên cần')} className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-[10px] font-bold rounded text-slate-400 hover:text-blue-300 transition-all">Chuyên cần</button>
                        </div>
                        <div className="absolute -bottom-3 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {sessionActiveStudent && currentUser?.role !== 'STUDENT' && (
                            <button 
                              onClick={() => handleSendToStudent(msg.text)}
                              className="px-2 py-1 bg-purple-600/80 hover:bg-purple-500 text-white rounded-md border border-purple-500/50 shadow-lg text-[10px] font-bold flex items-center gap-1.5"
                              title="Gửi trực tiếp vào Hộp thư Sinh viên"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                              Gửi cho SV
                            </button>
                          )}
                          <button 
                            onClick={() => { navigator.clipboard.writeText(msg.text); showToast('📋 Đã sao chép nội dung vào Clipboard!'); }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-white/10 shadow-lg text-[10px] font-bold flex items-center gap-1.5"
                            title="Sao chép nhanh lộ trình/tin nhắn"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            Sao chép nhanh
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-line text-slate-100 font-medium">{msg.text}</p>
                    )}
                  </div>
                  <div className={`text-[9px] text-slate-500 font-semibold px-2 flex items-center gap-1.5 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{msg.sender === 'user' ? (currentUser?.role === 'STUDENT' ? 'Sinh viên' : 'Giảng viên') : 'Hệ thống'}</span>
                    <span>•</span>
                    <span>{msg.time}</span>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-4 max-w-[92%] mr-auto animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white border border-purple-500/20 shadow-md flex-shrink-0">
                  <Bot size={14} />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="p-0 bg-transparent border-none shadow-none text-slate-400 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150"></span>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce delay-300"></span>
                    <span>NLP Router đang truy vấn Database...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Area: Action shortcuts row + Rounded Input Capsule Container */}
        <div className="px-8 py-5 border-t border-white/5 relative z-10 bg-slate-950/20 flex flex-col gap-2">
          <div className="max-w-6xl mx-auto w-full">
            {/* Scrollable Action Pills Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none max-w-full">
              {currentPills.map((pill, idx) => (
                <button
                  key={idx}
                  disabled={loading}
                  onClick={() => handleSend(pill.text)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/20 rounded-full text-[10px] font-bold text-slate-300 hover:text-blue-300 transition-all cursor-pointer whitespace-nowrap"
                >
                  {pill.icon}
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>

            {/* Centered Gemini Rounded Capsule Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="w-full bg-[#141923] border border-white/10 focus-within:border-purple-500/50 rounded-[28px] p-4 flex flex-col gap-2.5 transition-all relative shadow-2xl"
            >
              {/* Top row: Expanded Text Area */}
              <div className="flex items-start gap-1">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    currentUser?.role === 'STUDENT'
                      ? "Truy vấn hệ thống về kết quả học tập, rủi ro trượt môn và phương pháp cải thiện..."
                      : sessionActiveStudent
                        ? `Hỏi hệ thống về học lực, điểm số rủi ro của ${sessionActiveStudent.name}...`
                        : "Nhập câu hỏi học thuật, thống kê học sinh yếu toàn khoa..."
                  }
                  className="flex-1 bg-transparent border-none outline-none text-slate-100 text-sm py-1.5 px-2 resize-none placeholder-slate-500 min-h-[38px] custom-scrollbar focus:ring-0"
                />
              </div>
              
              {/* Capsule Divider */}
              <div className="border-t border-white/5 w-full my-0.5"></div>

              {/* Bottom Row: Tool strip (Dropdown, Actions, Send) */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  {/* Plus Attachment Button */}
                  <button
                    type="button"
                    className="p-2 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                    title="Đính kèm tệp học tập"
                    onClick={() => alert("Hệ thống tải tệp đính kèm học thuật đã sẵn sàng!")}
                  >
                    <Plus size={16} />
                  </button>

                  {/* Local AI Badge */}
                  <div className="relative">
                    <div className="appearance-none px-3.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-bold text-green-400">
                      Local AI Pipeline
                    </div>
                  </div>

                  {/* Pro Mode active indicator */}
                  <button
                    type="button"
                    onClick={() => updateActiveSession({ proMode: !proMode })}
                    className={`p-2 rounded-full transition-all cursor-pointer ${
                      proMode 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'hover:bg-white/5 text-slate-400 hover:text-white'
                    }`}
                    title={proMode ? "Đang bật chế độ Cố vấn Chuyên sâu" : "Bật chế độ Cố vấn Chuyên sâu"}
                  >
                    <Sparkles size={14} className={proMode ? "animate-pulse" : ""} />
                  </button>

                  {/* Bookmark Toggle */}
                  <button
                    type="button"
                    onClick={handleBookmark}
                    className={`p-2 rounded-full hover:bg-white/5 transition-all cursor-pointer ${
                      bookmarked ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Lưu trữ cuộc đối thoại này"
                  >
                    <Bookmark size={14} />
                  </button>

                  {/* Export Chat Report button */}
                  <button
                    type="button"
                    onClick={handleExport}
                    className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Xuất báo cáo kết quả (.txt)"
                  >
                    <Share size={14} />
                  </button>
                </div>

                {/* Circular Send Button with Up Arrow */}
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800/40 text-white disabled:text-slate-600 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:shadow-none hover:scale-105 cursor-pointer flex-shrink-0"
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </button>
              </div>
            </form>

            {/* Sub-label warning footer */}
            <span className="text-[10px] text-slate-500 font-semibold text-center block mt-3.5">
              EduGuard Offline Machine Learning Pipeline. Dữ liệu học thuật được bảo mật 100% tại máy chủ cục bộ (Không phụ thuộc Cloud API).
            </span>
          </div>
        </div>
      </div>

      {/* Premium Glassmorphic Toast Notification */}
      {toast.show && (
        <div className="absolute bottom-24 right-8 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-2xl text-xs font-bold text-slate-100 max-w-sm transition-all duration-300 transform translate-y-0 scale-100 shadow-blue-500/5 animate-fade-in">
          <div className={`w-2.5 h-2.5 rounded-full ${toast.type === 'success' ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.5)]'}`}></div>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
