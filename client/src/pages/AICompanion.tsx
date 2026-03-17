import { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageCircle,
  Plus,
  Settings,
  Trash2,
  Sparkles,
  Heart,
  AlertCircle,
  Wind,
  Loader2,
  ShieldAlert,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emotion_detected?: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  message_count: number;
  updated_at: string;
}

export default function AICompanion() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/ai-companion/conversations', { credentials: 'include' });
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/ai-companion/conversations/${conversationId}`, { credentials: 'include' });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/ai-companion/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: 'New Conversation' })
      });
      const data = await response.json();
      setCurrentConversation(data.conversation.id);
      setMessages([]);
      loadConversations();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Optimistically add user message
    const tempUserMessage = {
      id: 'temp-' + Date.now(),
      role: 'user' as const,
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/ai-companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: currentConversation,
          message: userMessage
        })
      });

      const data = await response.json();

      // Add AI response
      const aiMessage = {
        id: 'ai-' + Date.now(),
        role: 'assistant' as const,
        content: data.response,
        emotion_detected: data.emotionDetected,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      loadConversations(); // Refresh to update titles
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversationWithMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);
    setInputMessage(''); // clear input so user can't send twice

    try {
      // 1. Create conversation with a generated title based on first message
      const title = message.length > 25 ? message.substring(0, 25) + '...' : message;
      const convRes = await fetch('/api/ai-companion/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title })
      });
      const convData = await convRes.json();
      const newConvId = convData.conversation.id;

      setCurrentConversation(newConvId);

      // 2. Add temp user message
      const tempUserMessage: Message = {
        id: 'temp-' + Date.now(),
        role: 'user',
        content: message,
        created_at: new Date().toISOString()
      };
      setMessages([tempUserMessage]);

      // 3. Send message
      const chatRes = await fetch('/api/ai-companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: newConvId,
          message: message
        })
      });

      const chatData = await chatRes.json();

      const aiMessage: Message = {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        content: chatData.response,
        emotion_detected: chatData.emotionDetected,
        created_at: new Date().toISOString()
      };

      setMessages([tempUserMessage, aiMessage]);
      loadConversations();
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/ai-companion/conversations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversation === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setPendingDelete(null);
    }
  };

  const getEmotionEmoji = (emotion?: string) => {
    const emojiMap: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      anxious: '😰',
      angry: '😠',
      fearful: '😨',
      calm: '😌',
      excited: '🤩',
      depressed: '😔',
      stressed: '😣',
      hopeful: '🌟',
      lonely: '😞',
      confused: '😕',
      frustrated: '😤',
      peaceful: '☮️'
    };
    return emojiMap[emotion || 'neutral'] || '💭';
  };

  return (
    <div className="h-screen flex bg-slate-50 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at top right, #eef2ff, #f8fafc), radial-gradient(circle at bottom left, #faf5ff, transparent)' }}>
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Floating Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 md:relative md:z-10
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transition-transform duration-300 ease-in-out
        w-80 p-4 flex flex-col h-full
      `}>
        <div className="flex-1 bg-white/80 md:bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_32px_rgb(0_0_0/0.08)] md:shadow-[0_8px_32px_rgb(0_0_0/0.04)] flex flex-col overflow-hidden relative">

          {/* Mobile close button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden absolute top-4 right-4 p-2 bg-white/50 backdrop-blur rounded-full text-slate-500 hover:text-slate-800 z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="p-5 border-b border-white/50 bg-white/40">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setLocation('/dashboard')} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-white hover:text-slate-800 transition-colors shadow-sm" title="Back to Dashboard">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <a href="/crisis-support" title="Crisis Support" className="p-2 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                <AlertCircle className="w-5 h-5" />
              </a>
            </div>
            <div className="mb-4 pr-8 md:pr-0">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">AI Companion</h1>
              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mt-1">Mental Health Core</p>
            </div>
            <button
              onClick={() => {
                createNewConversation();
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span className="font-semibold text-sm">New Session</span>
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => { if (pendingDelete !== conv.id) setCurrentConversation(conv.id); }}
                className={`group p-3 rounded-xl cursor-pointer transition-all border ${currentConversation === conv.id
                  ? 'bg-white border-indigo-100 shadow-sm'
                  : 'border-transparent hover:bg-white/50 hover:border-slate-100'
                  }`}
              >
                {pendingDelete === conv.id ? (
                  <div className="flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                    <p className="text-xs text-slate-700 font-bold flex-1">Delete?</p>
                    <button onClick={() => setPendingDelete(null)} className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</button>
                    <button onClick={() => confirmDelete(conv.id)} className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-rose-500 text-white hover:bg-rose-600">Delete</button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className={`text-sm font-semibold truncate ${currentConversation === conv.id ? 'text-indigo-900' : 'text-slate-700'}`}>{conv.title}</h3>
                      <p className="text-[10px] font-black text-slate-600 mt-1 uppercase tracking-widest">{conv.message_count} messages</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setPendingDelete(conv.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 bg-white p-1.5 rounded-lg shadow-sm border border-slate-100"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400 hover:text-rose-600" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-white/50 bg-white/40 space-y-2">
            <button
              onClick={() => setLocation('/activities')}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 rounded-xl transition-all"
            >
              <Wind className="w-4 h-4" />
              <span className="uppercase tracking-widest">Guided Breathing</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              <Settings className="w-4 h-4" />
              <span className="uppercase tracking-widest">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-20 w-full max-w-full">
        {/* Mobile Header Toggle */}
        <div className="md:hidden absolute top-4 left-4 z-30 flex items-center gap-2">
          <button onClick={() => setLocation('/dashboard')} className="p-2.5 bg-white/80 backdrop-blur-md border border-white rounded-full shadow-sm text-slate-700 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-white/80 backdrop-blur-md border border-white rounded-full shadow-sm text-indigo-600 hover:text-indigo-900 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {currentConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-12 space-y-6 pb-40"> {/* pb-40 ensures we don't scroll under floating input */}
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center flex-shrink-0 mr-3 mt-1 shadow-sm">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-2xl rounded-3xl px-6 py-4 shadow-sm border ${message.role === 'user'
                      ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-br-sm border-transparent'
                      : 'bg-white/80 backdrop-blur-md text-slate-800 rounded-tl-sm border-white shadow-[0_4px_24px_rgb(0_0_0/0.02)]'
                      }`}
                  >
                    {message.role === 'assistant' && message.emotion_detected && (
                      <div className="inline-flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md bg-white border border-slate-100 shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <span>{getEmotionEmoji(message.emotion_detected)}</span>
                        <span>{message.emotion_detected}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{message.content}</p>

                    {/* Hyper-Personalized SOS Injection */}
                    {message.role === 'assistant' && ['anxious', 'fearful', 'panic', 'stressed', 'angry'].includes(message.emotion_detected || '') && index === messages.length - 1 && (
                      <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <ShieldAlert className="w-8 h-8 text-rose-500 mb-2 animate-pulse" />
                        <h4 className="font-semibold text-rose-900 mb-1">It seems you might be overwhelmed.</h4>
                        <p className="text-sm text-rose-700 mb-3">Would you like to try a quick grounding exercise to anchor yourself?</p>
                        <Link href="/sos" className="w-full">
                          <button className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors shadow-sm shadow-rose-500/30 flex items-center justify-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            Begin SOS Grounding
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center flex-shrink-0 mr-3 mt-1 shadow-sm opacity-50">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white/80 backdrop-blur-md border border-white rounded-3xl rounded-tl-sm px-6 py-4 flex items-center gap-3 shadow-[0_4px_24px_rgb(0_0_0/0.02)]">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    <span className="text-sm font-black text-slate-700 tracking-widest uppercase">Processing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Floating Input Area */}
            <div className="absolute bottom-4 md:bottom-6 left-0 right-0 px-4 md:px-8 pointer-events-none">
              <div className="max-w-4xl mx-auto pointer-events-auto relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
                <div className="relative bg-white/90 backdrop-blur-2xl border border-white shadow-2xl rounded-[2rem] p-1.5 md:p-2 flex items-end gap-2 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-300">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-transparent text-[14px] md:text-[15px] text-slate-800 placeholder:text-slate-500 focus:outline-none resize-none min-h-[48px] md:min-h-[56px] font-medium"
                    rows={1}
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 text-white flex flex-shrink-0 items-center justify-center transition-all shadow-md group-focus-within:shadow-indigo-500/30"
                  >
                    <Send className="w-5 h-5 ml-1" />
                  </button>
                </div>
                <p className="hidden md:block text-[10px] font-black text-slate-600 mt-3 text-center uppercase tracking-widest">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full p-4 md:p-8 relative overflow-hidden bg-white/50 pt-20 md:pt-8 w-full">
            {/* Background design elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-gradient-to-tr from-purple-300/20 to-blue-300/20 rounded-full blur-[80px] md:blur-[120px] -z-10 animate-pulse-slow"></div>

            <div className="w-full max-w-4xl text-center flex flex-col items-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mb-6 md:mb-8 shadow-2xl shadow-blue-500/10 transition-transform hover:scale-105 duration-500">
                <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-blue-500/80" />
              </div>

              <h2 className="text-3xl md:text-6xl font-black text-slate-800 mb-4 md:mb-6 tracking-tight leading-tight px-4">
                What's on your mind?
              </h2>
              <p className="text-base md:text-xl text-slate-700 mb-8 md:mb-12 font-bold max-w-2xl mx-auto leading-relaxed px-4">
                No judgment, no pressure. Type whatever you're feeling right now and your AI companion will be here to listen.
              </p>

              <div className="w-full relative group max-w-3xl mx-auto px-4 md:px-0">
                {/* Glow ring behind input */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-blue-500 rounded-[2rem] md:rounded-[2.5rem] blur-lg md:blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>

                <div className="relative flex flex-col sm:flex-row items-center gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-xl transition-all duration-300 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-200">
                  <textarea
                    autoFocus
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        startNewConversationWithMessage(inputMessage);
                      }
                    }}
                    placeholder="I'm feeling a bit overwhelmed today..."
                    className="w-full px-4 md:px-6 py-3 md:py-4 text-base md:text-xl text-slate-700 placeholder:text-slate-500 bg-transparent border-none focus:outline-none focus:ring-0 resize-none min-h-[60px] md:min-h-[80px]"
                    rows={2}
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => startNewConversationWithMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isLoading}
                    className="w-full sm:w-auto self-end sm:self-center h-12 md:h-16 px-6 md:px-8 rounded-xl md:rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-sm md:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 md:gap-3 shadow-lg hover:shadow-xl hover:-translate-y-1"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Send className="w-5 h-5 md:w-6 md:h-6" />}
                    <span>Send <span className="hidden sm:inline">Message</span></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
