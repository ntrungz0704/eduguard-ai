import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import { api } from '../lib/api';
import { MessageSquare, Send, Paperclip, User, Loader2, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Inbox() {
  const currentUser = useStore(state => state.currentUser);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [conversations, setConversations] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(searchParams.get('mssv') || null);
  const [activePartnerName, setActivePartnerName] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterTab, setFilterTab] = useState(searchParams.get('category') || 'all'); // 'all', 'urgent', 'resolved'
  
  const [inputMsg, setInputMsg] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const mssv = searchParams.get('mssv');
    const category = searchParams.get('category') || 'all';
    
    if (mssv !== activePartnerId) setActivePartnerId(mssv);
    if (category !== filterTab) setFilterTab(category);
  }, [searchParams]);

  useEffect(() => {
    if (activePartnerId) {
      const conv = conversations.find(c => c.partnerId === activePartnerId);
      if (conv) {
        setMessages((conv.messages || []).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)));
        setActivePartnerName(conv.partnerName);
        markAsRead(activePartnerId);
      } else {
        setMessages([]);
        setActivePartnerName(activePartnerId);
      }
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [activePartnerId, conversations]);

  const fetchConversations = async (showLoading = true) => {
    try {
      const res = await api.get(`/comm/messages/${currentUser.id}?role=${currentUser.role}`);
      setConversations(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách tin nhắn", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handlePartnerSelect = (id) => {
    setActivePartnerId(id);
    if (id) {
      setSearchParams({ category: filterTab, mssv: id });
    } else {
      setSearchParams({ category: filterTab });
    }
  };

  const handleTabSelect = (tab) => {
    setFilterTab(tab);
    if (activePartnerId) {
      setSearchParams({ category: tab, mssv: activePartnerId });
    } else {
      setSearchParams({ category: tab });
    }
  };

  const markAsRead = async (partnerId) => {
    try {
      await api.post('/comm/messages/read', {
        senderId: partnerId,
        receiverId: currentUser.id
      });
      // update local state
      setConversations(prev => prev.map(c => 
        c.partnerId === partnerId ? { ...c, unreadCount: 0, messages: c.messages.map(m => ({...m, isRead: true})) } : c
      ));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() && !file) return;
    
    setSending(true);
    const formData = new FormData();
    formData.append('senderId', currentUser.id);
    formData.append('receiverId', activePartnerId);
    formData.append('content', inputMsg);
    if (file) {
      formData.append('files', file);
    }

    try {
      const res = await api.post('/comm/messages', formData);
      const newMsg = res.data;
      
      setInputMsg('');
      setFile(null);
      
      // Update local state temporarily, then re-fetch
      setMessages(prev => [...prev, newMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      fetchConversations();
    } catch (err) {
      console.error("Lỗi gửi tin nhắn", err);
      alert("Lỗi gửi tin nhắn: " + err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-slate-600 dark:text-slate-400">Đang tải tin nhắn...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-80px)] -m-8 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950">
      {/* Left sidebar - Conversation list */}
      <div className={`w-80 border-r border-slate-200 dark:border-white/5 flex flex-col bg-white dark:bg-slate-900/50 ${activePartnerId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50">
          <h2 className="text-lg font-black text-[#0F172A] dark:text-white flex items-center gap-2 mb-4">
            <MessageSquare size={18} className="text-[#1D4ED8]" /> Hộp thư Inbox
          </h2>
          {currentUser.role !== 'STUDENT' && (
            <div className="flex bg-slate-100 dark:bg-black/40 p-1 rounded-lg border border-slate-200 dark:border-transparent">
              <button 
                onClick={() => handleTabSelect('all')}
                className={`flex-1 text-[10px] font-black py-1.5 rounded-md transition-all ${filterTab === 'all' ? 'bg-white text-[#1D4ED8] dark:bg-white/10 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => handleTabSelect('urgent')}
                className={`flex-1 text-[10px] font-black py-1.5 rounded-md transition-all ${filterTab === 'urgent' ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                Cần xử lý gấp
              </button>
              <button 
                onClick={() => handleTabSelect('resolved')}
                className={`flex-1 text-[10px] font-black py-1.5 rounded-md transition-all ${filterTab === 'resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                Đã theo dõi
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900/10">
          {conversations.filter(c => {
            if (filterTab === 'urgent') return c.unreadCount > 0;
            if (filterTab === 'resolved') return c.unreadCount === 0;
            return true;
          }).length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm font-semibold">Chưa có cuộc trò chuyện nào phù hợp.</div>
          ) : (
            conversations.filter(c => {
              if (filterTab === 'urgent') return c.unreadCount > 0;
              if (filterTab === 'resolved') return c.unreadCount === 0;
              return true;
            }).map(conv => (
              <div 
                key={conv.partnerId}
                onClick={() => handlePartnerSelect(conv.partnerId)}
                className={`p-4 border-b border-slate-200 dark:border-white/5 cursor-pointer transition-colors ${
                  activePartnerId === conv.partnerId ? 'bg-blue-50 border-l-4 border-l-[#1D4ED8] dark:bg-blue-500/10 dark:border-l-blue-500' : 'hover:bg-slate-50 dark:hover:bg-white/5 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-extrabold text-[#0F172A] dark:text-slate-200 text-sm truncate">{conv.partnerName}</h4>
                  {conv.unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-400 truncate font-semibold">{conv.lastMessage || (conv.messages[conv.messages.length-1]?.attachments?.length > 0 ? '[Đính kèm tài liệu]' : '')}</p>
                <p className="text-[9px] text-slate-500 mt-1 font-bold">{new Date(conv.lastMessageAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right side - Chat area */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-slate-950/80 ${!activePartnerId ? 'hidden md:flex' : 'flex'} border-l border-slate-200 dark:border-transparent`}>
        {activePartnerId ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950 flex items-center gap-3 shadow-sm">
              <button 
                className="md:hidden p-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent rounded-lg text-slate-700 dark:text-slate-400"
                onClick={() => handlePartnerSelect(null)}
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-gradient-to-tr dark:from-blue-500 dark:to-purple-600 flex items-center justify-center dark:text-white">
                <User size={18} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A] dark:text-slate-200">{activePartnerName}</h3>
                <p className="text-xs text-green-600 dark:text-slate-400 font-bold">Trực tuyến</p>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white dark:bg-slate-950/10">
              {messages.map(msg => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    <div className={`p-4 rounded-2xl text-sm shadow-sm ${
                      isMe 
                        ? 'bg-[#4169E1] text-white font-semibold rounded-tr-none' 
                        : 'bg-[#F0F0F0] dark:bg-slate-800 text-[#0F172A] dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-white/5'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      
                      {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.attachments.map(att => (
                            <a 
                              key={att.id} 
                              href={att.fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-2 p-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-transparent rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-black/30 transition-colors shadow-sm"
                            >
                              <Paperclip size={14} className="text-blue-600" />
                              <span className="truncate max-w-[200px]">{att.fileName}</span>
                            </a>
                          ))}
                        </div>
                      )}
                      
                      <div className={`text-[9px] mt-2 opacity-70 font-bold ${isMe ? 'text-right text-blue-100' : 'text-left text-slate-500'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950">
              {file && (
                <div className="mb-2 flex items-center gap-2 text-xs bg-purple-100 text-purple-700 p-2 rounded-lg w-max font-bold border border-purple-300">
                  <Paperclip size={14} /> {file.name} 
                  <button onClick={() => setFile(null)} className="ml-2 text-rose-600 font-bold hover:text-rose-800">X</button>
                </div>
              )}
              <form onSubmit={handleSend} className="flex gap-2">
                <label className="p-3 bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors border border-slate-200 dark:border-white/5 shadow-sm">
                  <Paperclip size={20} />
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                </label>
                <input 
                  type="text" 
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Nhập tin nhắn..." 
                  className="flex-1 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 focus:border-[#4169E1] rounded-xl px-4 text-sm text-[#0F172A] dark:text-white outline-none transition-all shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={sending || (!inputMsg.trim() && !file)}
                  className="p-3 bg-[#4169E1] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-md flex items-center justify-center"
                >
                  {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageSquare size={48} className="opacity-20 mb-4" />
            <p>Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
}
