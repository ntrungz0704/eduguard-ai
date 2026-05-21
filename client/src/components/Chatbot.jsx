import { useState, useRef, useEffect } from 'react';
import { Bot, MessageSquare, X, Send, Sparkles, AlertTriangle, BookOpen, Terminal, RefreshCw } from 'lucide-react';
import { useStore } from '../store';
import { api } from '../lib/api';

export default function Chatbot() {
  const activeStudent = useStore(state => state.activeStudent);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: '👋 Xin chào! Tôi là trợ lý EduGuard AI, được huấn luyện trên dữ liệu điểm của FPT Polytechnic.\n\nTôi có thể giúp gì cho bạn hôm nay? Bạn có thể click chọn câu hỏi nhanh dưới đây hoặc nhập câu hỏi riêng nhé!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Trigger contextual assistant mode when viewing a student profile
  useEffect(() => {
    if (activeStudent) {
      setIsOpen(true);
      const systemWelcome = {
        sender: 'ai',
        text: `🔮 **CỐ VẤN NHẬP HỒN: Đang xem hồ sơ sinh viên ${activeStudent.name} (${activeStudent.mssv})**\n\nTôi đang đọc bảng điểm của em ấy. Hãy hỏi tôi về:\n• *Điểm mạnh và điểm yếu môn học của sinh viên?*\n• *Nguy cơ học thuật & môn học kỳ sau trượt cao?*\n• *Giải pháp can thiệp cụ thể?*`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, systemWelcome]);
    }
  }, [activeStudent]);

  const quickPrompts = [
    { text: 'Môn nào dễ tạch nhất?', icon: <AlertTriangle size={14} className="text-rose-400" /> },
    { text: 'Sinh viên nào nguy cơ cao?', icon: <Bot size={14} className="text-purple-400" /> },
    { text: 'Công thức toán dự đoán?', icon: <Terminal size={14} className="text-cyan-400" /> },
    { text: 'Chương trình có mấy môn?', icon: <BookOpen size={14} className="text-emerald-400" /> }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const msgText = textToSend || input;
    if (!msgText.trim()) return;

    // Add user message
    const userMsg = {
      sender: 'user',
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Map current message logs to API history shape before updating state
    const historyPayload = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        message: msgText,
        studentContext: activeStudent,
        history: historyPayload
      });
      const aiReply = {
        sender: 'ai',
        text: res.data.reply || 'Rất tiếc, tôi đang gặp lỗi xử lý dữ liệu học tập.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      const errorReply = {
        sender: 'ai',
        text: '❌ Không thể kết nối với máy chủ AI. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const formatText = (text) => {
    if (!text) return '';
    // Format bullet points, bold tags, newlines
    return text.split('\n').map((line, i) => {
      // Bold format **text**
      let formattedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-white font-bold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : line;

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <li key={i} className="ml-4 list-disc pl-1 mb-1 text-slate-300">
            {line.trim().startsWith('•') ? line.replace('•', '').trim() : line.replace('-', '').trim()}
          </li>
        );
      }
      
      return <p key={i} className="mb-2 text-slate-300 leading-relaxed">{content}</p>;
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:shadow-[0_0_35px_rgba(59,130,246,0.7)] transition-all duration-300 hover:scale-110 z-50 group border border-white/10"
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        {isOpen ? <X size={24} className="animate-spin-slow" /> : <Bot size={24} className="group-hover:animate-bounce" />}
      </button>

      {/* Chat Drawer Widget */}
      <div
        className={`fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-10rem)] glass-panel rounded-3xl border border-white/10 flex flex-col shadow-2xl z-50 overflow-hidden transition-all duration-500 transform ${
          isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Chat Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between relative z-10 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border border-white/10">
              <Bot size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                Trợ lý EduGuard AI <Sparkles size={14} className="text-amber-400 animate-pulse" />
              </h4>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-[10px] text-green-400 font-medium">Sẵn sàng (Local NLP)</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar relative z-10">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto items-end animate-slide-in-right' : 'mr-auto items-start animate-slide-in-left'
              }`}
            >
              <div
                className={`p-4 rounded-2xl text-sm border ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/30 rounded-tr-none shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                    : 'bg-white/5 text-slate-200 border-white/5 rounded-tl-none shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]'
                }`}
              >
                {msg.sender === 'ai' ? formatText(msg.text) : <p className="leading-relaxed">{msg.text}</p>}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1 font-medium">{msg.time}</span>
            </div>
          ))}

          {loading && (
            <div className="flex flex-col items-start max-w-[85%] mr-auto animate-pulse">
              <div className="p-4 rounded-2xl bg-white/5 text-slate-200 border border-white/5 rounded-tl-none flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce delay-300"></span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">Đang truy vấn...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Container */}
        {messages.length === 1 && !loading && (
          <div className="px-5 py-3 border-t border-white/5 bg-slate-950/20 relative z-10">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">Gợi ý nhanh cho giảng viên:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(qp.text)}
                  className="p-2.5 bg-white/5 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/20 rounded-xl text-left text-xs font-semibold text-slate-300 hover:text-blue-300 flex items-center gap-2 transition-all"
                >
                  {qp.icon}
                  <span className="truncate">{qp.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Footer */}
        <div className="p-4 border-t border-white/10 relative z-10 bg-slate-900/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi về lớp học, điểm số..."
              disabled={loading}
              className="flex-1 bg-black/25 border border-white/10 hover:border-white/20 focus:border-blue-500/50 outline-none text-white text-sm px-4 py-3 rounded-xl transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:shadow-none hover:scale-105"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
