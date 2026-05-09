import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For tables
import rehypeRaw from 'rehype-raw'; // For HTML tags like <br>
import { marked } from 'marked';
import { useApp } from '../context/AppContext';
import { Send, ArrowLeft, AlertTriangle, Paperclip, FileText, Image as ImageIcon, Database, X, Zap, Loader2, CheckCircle, File, User, Sparkles, MessageSquare, Menu, Plus, Trash2, ChevronDown, Cpu, Download, HelpCircle, Info } from 'lucide-react';

import { ThreadAnalyzer } from './ThreadAnalyzer';
import { BrainLogo } from './BrainLogo';
import { StoredDocument } from '../types';
import { useNavigate } from 'react-router-dom';
import { FeedbackModal } from './FeedbackModal';

import { useAuth } from '../context/AuthContext';
import { authFetch } from '../lib/auth';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const ExpertChat: React.FC = () => {
  const { user } = useAuth();
  const { clientData, activeDepartment, setActiveDepartment, conversations, addMessage, departmentDocuments, addDocument, removeDocument, setConversationMessages, userProfile, refreshUserProfile } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [chats, setChats] = useState<{ id: string; title: string; createdAt: number }[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [fetchedDocuments, setFetchedDocuments] = useState<StoredDocument[]>([]);

  const MODELS = [
    { id: 'auto', name: 'Auto Select', provider: 'auto' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude 3.5 Sonnet', provider: 'claude' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  ];
  
  // Filter models based on user permissions
  const availableModels = MODELS.filter(m => 
    m.id === 'auto' || (userProfile?.allowedModels || []).includes(m.provider)
  );

  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [showModelMenu, setShowModelMenu] = useState(false);

  // Get API URL from environment
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [urlInput, setUrlInput] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showContextRepo, setShowContextRepo] = useState(false);
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showScrapingGuide, setShowScrapingGuide] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [scrapedReviewText, setScrapedReviewText] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pendingScrapeUrl, setPendingScrapeUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'general' | 'template' | 'sop'>('general');



  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (userProfile && userProfile.credits <= 0) {
      setShowFeedbackModal(true);
    } else {
      setShowFeedbackModal(false);
    }
  }, [userProfile]);



  useEffect(() => {
    scrollToBottom();
    
    // First time disclaimer logic
    const hasSeenDisclaimer = localStorage.getItem('agent_chat_disclaimer_seen');
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
      localStorage.setItem('agent_chat_disclaimer_seen', 'true');
    }
  }, [conversations, activeDepartment, messages]);


  useEffect(() => {
    if (messages.length > 0 && !localStorage.getItem('chat_tour_completed')) {
      const driverObj = driver({
        showProgress: true,
        steps: [
          {
            element: '#step-context-btn',
            popover: {
              title: 'Upload Your Context',
              description: 'Training the AI is as simple as uploading your documents here. PDFs, Docs, and Websites are all supported.',
              side: "bottom",
              align: 'end'
            }
          },
          {
            element: '#step-chat-input',
            popover: {
              title: 'Chat with your Expert',
              description: 'Type your questions here. Your expert uses the uploaded context to provide accurate, non-hallucinated answers.',
              side: "top",
              align: 'center'
            }
          },
          {
             element: '.md\\:relative.z-40.md\\:z-auto',
             popover: {
               title: 'Chat History',
               description: 'All your conversations are saved per department. You can create new chats or revisit old ones here.',
               side: "right",
               align: 'start'
             }
          }
        ],
        onDestroyStarted: () => {
          localStorage.setItem('chat_tour_completed', 'true');
          driverObj.destroy();
        },
      });

      driverObj.drive();
    }
  }, [messages]);

  const [chatsLoading, setChatsLoading] = useState(false);

  const fetchDepartmentDocuments = async () => {
    if (!activeDepartment || !user?.id) return;
    try {
      // Fetch department specific docs
      const deptRes = await authFetch(`${API_URL}/api/documents/department/${activeDepartment}?userId=${user.id}`);
      const deptData = await deptRes.json();
      const deptDocs = deptData.documents || [];

      // Fetch universal docs
      const univRes = await authFetch(`${API_URL}/api/documents/department/Universal?userId=${user.id}`);
      const univData = await univRes.json();
      const univDocs = univData.documents || [];

      // Merge and set
      setFetchedDocuments([...deptDocs, ...univDocs]);
    } catch (err) {
      console.error("Failed to load department documents", err);
    }
  };

  // Fetch department chats on department change
  useEffect(() => {
    if (!activeDepartment || !user?.id) return;

    const fetchChats = async () => {
      try {
        setChatsLoading(true);
        const res = await authFetch(`${API_URL}/api/chat/department/${activeDepartment}?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          const loadedChats = data.chats || [];
          setChats(loadedChats);
          
          if (loadedChats.length > 0) {
            setCurrentChatId(loadedChats[0].id);
          } else {
            setCurrentChatId(null);
            setMessages([]);
          }
        }

        // Fetch department-wide documents
        await fetchDepartmentDocuments();

      } catch (err) {
        console.error("Failed to load chats list", err);
      } finally {
        setChatsLoading(false);
      }
    };
    fetchChats();
  }, [activeDepartment, user?.id]);

  // Fetch specific chat history when currentChatId changes
  useEffect(() => {
    if (!currentChatId || !user?.id) {
      if (!currentChatId) setMessages([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`${API_URL}/api/chat/session/${currentChatId}?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.history || []);
          // Do not set fetchedDocuments here; they are now department-wide
        }
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [currentChatId, user?.id]);

  // Fetch default AI config
  useEffect(() => {
    const fetchAIConfig = async () => {
      try {
          const res = await authFetch(`${API_URL}/api/settings/ai-config`);
        if (res.ok) {
          const data = await res.json();
          // Find the model in our local MODELS list that matches the backend default
          const defaultModel = MODELS.find(m => m.id === data.model) || 
                               MODELS.find(m => m.provider === data.modelProvider) || 
                               MODELS[0];
          setSelectedModel(defaultModel);
        }
      } catch (err) {
        console.error("Failed to fetch AI config", err);
      }
    };
    fetchAIConfig();
  }, []);

  const refreshChats = async () => {
    if (!activeDepartment || !user?.id) return;
    const res = await authFetch(`${API_URL}/api/chat/department/${activeDepartment}?userId=${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setChats(data.chats || []);
    }
  };

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      await authFetch(`${API_URL}/api/chat/session/${chatId}?userId=${user.id}`, { method: 'DELETE' });
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      refreshChats();
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  if (!clientData || !activeDepartment) return null;

  // Use local 'messages' state instead of global context for now, as we moved to multi-chat
  // const currentMessages = conversations[activeDepartment]?.messages || []; 
  // We use 'messages' and 'fetchedDocuments' state directly
  const currentMessages = messages;
  const currentDocs = fetchedDocuments;

  const handleSend = async () => {
    if (!input.trim() || loading || !user?.id) return;

    // Check credits before sending
    if (userProfile && userProfile.credits <= 0) {
      setShowLowBalanceModal(true);
      return;
    }

    const userText = input;
    setInput('');
    setLoading(true);

    // Optimistically add user message
    const tempMsg = { role: 'user', content: userText, id: Date.now().toString() };
    setMessages(prev => [...prev, tempMsg]);

    // Create placeholder for assistant message
    const assistantMsgId = (Date.now() + 1).toString();
    const assistantPlaceholder = {
      role: 'assistant',
      content: '', // Start empty
      id: assistantMsgId
    };
    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      const res = await authFetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientData,
          department: activeDepartment,
          userMessage: userText,
          contextDocs: currentDocs,
          chatId: currentChatId, // Pass current ID if exists
          userId: user.id,
          modelProvider: selectedModel.provider === 'auto' ? undefined : selectedModel.provider,
          model: selectedModel.id === 'auto' ? undefined : selectedModel.id
        })
      });

      if (!res.ok) throw new Error("API call failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const json = line.replace('data: ', '').trim();
          if (!json) continue;

          const data = JSON.parse(json);

          if (data.text && !data.done) {
            assistantContent += data.text;
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, content: assistantContent }
                  : m
              )
            );
          }

          if (data.done) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMsgId
                  ? {
                    ...m,
                    content: data.text || assistantContent,
                    escalation: data.escalation,
                    id: data.messageId || m.id
                  }
                  : m
              )
            );

            if (data.chatId && data.chatId !== currentChatId) {
              setCurrentChatId(data.chatId);
              refreshChats();
            }

            // Refresh credits after message is done
            refreshUserProfile();
          }
        }
      }


    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? { ...m, content: m.content + "\n\n[Error: Connection interrupted or failed]" }
          : m
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDraft = (draft: string) => {
    setInput(draft);
    setShowAnalyzer(false);
  };

  const handleExportDocument = async (content: string) => {
    try {
      const res = await authFetch(`${API_URL}/api/chat/export-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: content,
          department: activeDepartment
        })
      });

      if (!res.ok) throw new Error("Export failed on server");

      const blob = await res.blob();
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `${activeDepartment}_Export_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export document.");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadStatus('uploading');

    try {
      // Ensure we have a chat ID to attach this to
      let attachChatId = currentChatId;
      if (!attachChatId) {
        attachChatId = crypto.randomUUID();
        setCurrentChatId(attachChatId);
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Limit size to 100MB per file (Cloudflare Limit)
        if (file.size > 100 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Max limit is 100MB.`);
          continue;
        }

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('chatId', effectiveChatId);
          formData.append('userId', user?.id || '');
          formData.append('department', activeDepartment);
          formData.append('category', selectedCategory);

          await authFetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
          });

        } catch (err) {
          console.error(`Failed to upload ${file.name}`, err);
        }
      }

      await fetchDepartmentDocuments();
      await refreshChats();
      setShowContextRepo(true);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 2500);

    } catch (err) {
      console.error("General upload error", err);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (doc: StoredDocument) => {
    if (!confirm(`Delete ${doc.name}?`)) return;

    try {
      if (currentChatId) {
        await authFetch(`${API_URL}/api/upload?chatId=${doc.chatId || currentChatId}&filename=${encodeURIComponent(doc.name)}&userId=${user?.id}`, {
          method: 'DELETE'
        });
      }

      removeDocument(activeDepartment, doc.id); // clean context just in case
      await fetchDepartmentDocuments();
    } catch (err) {
      console.error("Failed to delete document", err);
      await fetchDepartmentDocuments();
    }
  };
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setIsScrapingUrl(true);
    try {
      let attachChatId = currentChatId;
      if (!attachChatId) {
        attachChatId = crypto.randomUUID();
        setCurrentChatId(attachChatId);
      }

      const res = await authFetch(`${API_URL}/api/upload/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput,
          chatId: attachChatId,
          userId: user?.id,
          department: activeDepartment,
          dryRun: true,
          category: selectedCategory
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process URL");
      }
      const data = await res.json();
      
      if (data.dryRun) {
        setScrapedReviewText(data.scrapedText);
        setPendingScrapeUrl(data.url);
        setShowReviewModal(true);
        setUrlInput('');
      } else {
        setUrlInput('');
        await fetchDepartmentDocuments();
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to extract context: ${err.message}`);
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleSaveScrapedText = async () => {
    setIsScrapingUrl(true);
    try {
      const res = await authFetch(`${API_URL}/api/upload/save-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentChatId,
          userId: user?.id,
          department: activeDepartment,
          filename: pendingScrapeUrl,
          content: scrapedReviewText,
          category: selectedCategory
        })
      });

      if (!res.ok) throw new Error("Failed to save reviewed text");
      
      setShowReviewModal(false);
      setScrapedReviewText('');
      await fetchDepartmentDocuments();
    } catch (err) {
      console.error(err);
      alert("Error saving text");
    } finally {
      setIsScrapingUrl(false);
    }
  };


  return (
    <div className="h-screen bg-white flex overflow-hidden relative">
      {/* Mobile Sidebar Backdrop */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Chats Sidebar */}
      <div className={`${showSidebar ? 'w-72 md:w-64' : 'w-0 overflow-hidden'} fixed md:relative z-40 md:z-auto inset-y-0 left-0 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out`}>
        <div className={`${showSidebar ? 'opacity-100' : 'opacity-0'} flex flex-col h-full transition-opacity duration-200`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <button onClick={() => setShowSidebar(false)} className="md:block hidden text-gray-400 hover:text-gray-600">
            <Menu className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Department Selector (Top) */}
          <div className="mb-6">
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Department</p>
            <div className="flex flex-wrap gap-2 px-2">
              {clientData.selected_departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setActiveDepartment(dept)}
                  className={`text-xs px-2 py-1 rounded-md border transition-colors ${activeDepartment === dept
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => { setCurrentChatId(null); setMessages([]); }}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>

          <div className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            Recent {activeDepartment} Chats
            <span className="bg-gray-200 text-gray-600 px-1.5 rounded text-[10px]">{chats.length}</span>
          </div>

          <div className="space-y-1">
            {chatsLoading ? (
              <div className="space-y-2 px-2 py-4">
                <div className="w-full h-8 bg-gray-200 rounded animate-pulse" />
                <div className="w-3/4 h-8 bg-gray-200 rounded animate-pulse" />
                <div className="w-full h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            ) : chats.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-4 italic">No history yet</p>
            ) : (
              chats.map(chat => (
                <div key={chat.id} className="relative group">
                  <button
                    onClick={() => setCurrentChatId(chat.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all pr-8 ${currentChatId === chat.id
                      ? 'bg-white shadow-sm ring-1 ring-gray-200 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 overflow-hidden'
                      }`}
                  >
                    <MessageSquare className={`w-4 h-4 shrink-0 ${currentChatId === chat.id ? 'text-indigo-500' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium truncate block w-full">{chat.title}</span>
                  </button>
                  <button
                    onClick={(e) => deleteChat(e, chat.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                    title="Delete Chat"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          {/* Wallet / Credits Section */}
          <div className="mb-4 px-2">
            <div className={`rounded-xl p-3 text-white shadow-sm transition-all ${userProfile?.credits <= 0 ? 'bg-red-600' : 'bg-gray-900 border border-gray-800'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Credits Balance</span>
                <Zap className={`w-3 h-3 ${userProfile?.credits <= 0 ? 'text-white animate-pulse' : 'text-amber-400 fill-amber-400'}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white">{userProfile?.credits?.toFixed(1) || '0.0'}</span>
              </div>
              {userProfile?.credits <= 0 && (
                <p className="text-[9px] mt-2 font-bold bg-black/20 p-2 rounded leading-tight border border-white/10">
                  WALLET EMPTY. CONTACT ADMIN.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              {clientData.business_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{clientData.business_name}</p>
              <p className="text-xs text-gray-500 truncate hidden md:block">{userProfile?.role === 'admin' ? 'Admin Access' : 'Premium Plan'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 min-w-0 transition-all">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors md:hidden">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2 truncate max-w-[150px] md:max-w-none">
                <BrainLogo width={20} height={20} />
                <span className="truncate">{activeDepartment} Expert</span>
              </h2>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              id="step-context-btn"
              onClick={() => setShowContextRepo(!showContextRepo)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-all border flex items-center gap-2 ${showContextRepo ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'}`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Context</span>
              {currentDocs.length > 0 && <span className={`text-xs px-1.5 rounded-full ${showContextRepo ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>{currentDocs.length}</span>}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Context Repository Sidebar */}
          {showContextRepo && (
            <>
              {/* Context Backdrop on Mobile */}
              <div 
                className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                onClick={() => setShowContextRepo(false)}
              />
              <div className="fixed md:relative right-0 inset-y-0 w-full md:w-[320px] bg-white border-l md:border-r border-gray-200 flex flex-col z-40 md:z-10 shadow-xl transition-all">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Database className="w-4 h-4 text-midnight" /> Knowledge Base
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-1">AI uses these files as absolute truth.</p>
                </div>
                <button onClick={() => setShowContextRepo(false)} className="hover:bg-gray-200 rounded p-1"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {currentDocs.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <p className="mb-2">No documents yet.</p>
                    <p className="text-xs text-gray-400">Upload PDFs, Contracts, or Guidelines to train this expert.</p>
                  </div>
                ) : (
                  currentDocs.map((doc, idx) => (
                    <div key={doc.id || idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-start gap-3 hover:border-neural-DEFAULT hover:shadow-md transition-all cursor-default group">
                      {doc.type.startsWith('image/') ? (
                        <ImageIcon className="w-8 h-8 p-1.5 bg-cyan-50 text-cyan-600 rounded-lg shrink-0" />
                      ) : doc.type === 'application/pdf' ? (
                        <FileText className="w-8 h-8 p-1.5 bg-red-50 text-red-600 rounded-lg shrink-0" />
                      ) : (
                        <File className="w-8 h-8 p-1.5 bg-gray-50 text-gray-600 rounded-lg shrink-0" />
                      )}
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-gray-800 truncate">{doc.name}</p>
                          {doc.category && doc.category !== 'general' && (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                              doc.category === 'template' ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-teal-100 text-teal-600 border border-teal-200'
                            }`}>
                              {doc.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-gray-400">
                          {new Date(doc.uploadedAt).toLocaleDateString()} • {doc.type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteDocument(doc)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadStatus === 'uploading'}
                  className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-midnight/20 disabled:opacity-70 disabled:cursor-wait ${uploadStatus === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                    uploadStatus === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                      'bg-midnight hover:bg-gray-900 text-white'
                    }`}
                >
                  {uploadStatus === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploadStatus === 'success' && <CheckCircle className="w-4 h-4" />}
                  {uploadStatus === 'error' && <AlertTriangle className="w-4 h-4" />}
                  {uploadStatus === 'idle' && <Paperclip className="w-4 h-4" />}

                  {uploadStatus === 'uploading' ? 'Uploading...' :
                    uploadStatus === 'success' ? 'Uploaded Success!' :
                      uploadStatus === 'error' ? 'Upload Failed' :
                        'Upload Document'}
                </button>

                <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Add Website Context</p>
                    <button 
                      onClick={() => setShowScrapingGuide(true)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                      title="How to add links"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-2 items-center mb-3">
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value as any)}
                      className="text-[10px] bg-white border border-gray-200 rounded px-2 py-1 font-bold text-gray-600 focus:border-indigo-500 outline-none"
                    >
                      <option value="general">General Doc</option>
                      <option value="template">Template</option>
                      <option value="sop">SOP</option>
                    </select>
                    <div className="flex-1 h-[1px] bg-gray-100"></div>
                  </div>

                  <div className="flex gap-2">

                    <input 
                      type="url" 
                      placeholder="https://example.com" 
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      onKeyDown={(e) => {
                         if (e.key === 'Enter') handleUrlSubmit();
                      }}
                    />
                    <button 
                      onClick={handleUrlSubmit}
                      disabled={isScrapingUrl || !urlInput.trim()}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {isScrapingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt,.md,.json,.csv,.png,.jpg,.jpeg,.webp"
            multiple
          />

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white w-full relative">
            <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
              <div className="max-w-[59rem] mx-auto px-4 py-8 space-y-8">
                {currentMessages.length === 0 && (
                  loading ? (
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400 select-none animate-fadeIn">
                      <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mb-4" />
                      <p className="text-gray-500 font-medium">Loading conversation...</p>
                    </div>
                  ) : (
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400 select-none animate-fadeIn">
                      <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-3xl mb-8 flex items-center justify-center shadow-sm">
                        <BrainLogo width={64} height={64} className="opacity-80" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">How can I help with {activeDepartment}?</h3>
                      <p className="text-gray-500 max-w-md text-center">
                        I'm trained on your company's documents and guidelines. Ask me anything about processes, contracts, or strategies.
                      </p>
                    </div>
                  )
                )}

                {currentMessages.map((msg, idx) => (
                  <div key={msg.id || idx} className={`group animate-fadeIn flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row justify-start max-w-4xl'}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 shadow-sm mt-1 ${msg.role === 'user' ? 'bg-gray-200 rounded-full' : 'bg-transparent'}`}>
                      {msg.role === 'user' ? (
                        <User className="w-5 h-5 text-gray-600" />
                      ) : (
                        <BrainLogo width={28} height={28} />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div className={`relative ${msg.role === 'user'
                        ? 'bg-[#f4f4f4] text-gray-900 rounded-3xl px-4 md:px-6 py-3 md:py-4 max-w-[90%] md:max-w-[85%]'
                        : 'text-gray-800 px-2 md:px-5 pt-1' // Added padding for assistant
                        }`}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-neutral max-w-none 
                            prose-p:text-[16px] prose-p:leading-9 prose-p:my-6 prose-p:text-gray-800
                            prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mt-10 prose-headings:mb-5 
                            prose-ul:my-8 prose-ul:list-disc prose-ul:pl-6
                            prose-li:my-3 prose-li:text-gray-800 prose-li:leading-9
                            prose-strong:font-bold prose-strong:text-gray-900
                            prose-code:text-indigo-600 prose-code:bg-indigo-50/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-medium text-base">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                              // components={{
                              //   h1: ({ children }) => (
                              //     <h1 className="text-2xl font-bold mt-10 mb-4 text-gray-900">
                              //       {children}
                              //     </h1>
                              //   ),
                              //   h2: ({ children }) => (
                              //     <h2 className="text-xl font-semibold mt-8 mb-3 text-gray-900">
                              //       {children}
                              //     </h2>
                              //   ),
                              //   h3: ({ children }) => (
                              //     <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-800">
                              //       {children}
                              //     </h3>
                              //   ),
                              //   p: ({ children }) => (
                              //     <p className="my-5 leading-8 text-gray-800 text-[16px]">
                              //       {children}
                              //     </p>
                              //   ),
                              //   ul: ({ children }) => (
                              //     <ul className="list-disc pl-6 my-6 space-y-3">
                              //       {children}
                              //     </ul>
                              //   ),
                              //   li: ({ children }) => (
                              //     <li className="leading-7 text-gray-800">
                              //       {children}
                              //     </li>
                              //   ),
                              //   strong: ({ children }) => (
                              //     <strong className="font-semibold text-gray-900">
                              //       {children}
                              //     </strong>
                              //   ),
                              // }}
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-2xl font-bold mt-10 mb-4 text-gray-900">{children}</h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-xl font-semibold mt-8 mb-3 text-gray-900">{children}</h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-800">{children}</h3>
                                ),
                                p: ({ children }) => (
                                  <p className="my-5 leading-8 text-gray-800 text-[16px]">{children}</p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-6 my-6 space-y-3">{children}</ul>
                                ),
                                li: ({ children }) => (
                                  <li className="leading-7 text-gray-800">{children}</li>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-gray-900">{children}</strong>
                                ),

                                /* ✅ TABLE — isolated */
                                table: ({ children }) => (
                                  <div className="not-prose my-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/5">
                                    <table className="w-full table-fixed border-collapse text-left">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({ children }) => (
                                  <thead className="bg-gray-50/50 border-b border-gray-100">{children}</thead>
                                ),
                                tbody: ({ children }) => (
                                  <tbody className="divide-y divide-gray-50 bg-white">{children}</tbody>
                                ),
                                tr: ({ children }) => (
                                  <tr className="hover:bg-gray-50/30 transition-colors">{children}</tr>
                                ),
                                th: ({ children }) => (
                                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-left">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="px-5 py-4 text-[14px] text-gray-700 leading-relaxed align-top break-words">
                                    {children}
                                  </td>
                                ),
                              }}

                            >
                              {msg.content}
                            </ReactMarkdown>

                            <div className="mt-4 pt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleExportDocument(msg.content)}
                                title="Export as Word Document"
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg shadow-sm transition-all"
                              >
                                <Download className="w-4 h-4" />
                                Export Word Doc
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-7 text-[15px]">{msg.content}</p>
                        )}

                        {/* Escalation/Warning Block */}
                        {msg.escalation?.required && (
                          <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-amber-900">Expert Review Required</p>
                              <p className="text-xs text-amber-700 mt-1">
                                Flagged for: <span className="font-medium">"{msg.escalation.reason}"</span>.
                                Forwarded to {msg.escalation.approver || 'Department Head'}.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-4 animate-fadeIn">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm">
                      <BrainLogo width={20} height={20} />
                    </div>
                    <div className="flex items-center gap-1 h-8">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/90 backdrop-blur pb-8">
              <div className="max-w-3xl mx-auto relative px-4">
                <div id="step-chat-input" className="relative bg-[#f4f4f4] rounded-[26px] border border-transparent focus-within:border-gray-300 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-200 transition-all overflow-hidden shadow-sm hover:border-gray-300">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={`Message ${activeDepartment} expert...`}
                    className="w-full pl-5 pr-14 py-4 bg-transparent outline-none resize-none text-gray-900 placeholder-gray-500 text-[16px] leading-6"
                    rows={1}
                    style={{ minHeight: '52px', maxHeight: '200px' }}
                  />

                  {/* Actions */}
                  <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadStatus === 'uploading'}
                      className={`p-2 rounded-full transition-colors ${uploadStatus === 'uploading' ? 'text-indigo-600 bg-indigo-50 cursor-wait' :
                        uploadStatus === 'success' ? 'text-green-600 bg-green-50' :
                          uploadStatus === 'error' ? 'text-red-500 bg-red-50' :
                            'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                        }`}
                      title={uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Context'}
                    >
                      {uploadStatus === 'uploading' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                        uploadStatus === 'success' ? <CheckCircle className="w-5 h-5" /> :
                          uploadStatus === 'error' ? <AlertTriangle className="w-5 h-5" /> :
                            <Paperclip className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className={`p-2 rounded-full transition-all ${input.trim() && !loading
                        ? 'bg-black text-white shadow-md hover:opacity-90'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-center mt-3">
                  <p className="text-[11px] text-gray-400">
                    TheWorkimnd can make mistakes. Verify critical information.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Analyzer Side Panel */}
          {showAnalyzer && (
            <div className="fixed md:relative inset-0 md:inset-auto z-50 md:z-20 w-full md:w-[400px] border-l border-gray-200 bg-white shadow-2xl flex flex-col">
              <ThreadAnalyzer onClose={() => setShowAnalyzer(false)} onApply={handleApplyDraft} />
            </div>
          )}
        </div>

        {/* Simple Shield Icon for footer */}
        <div className="hidden">
          <Shield />
        </div>
      </div>
      {/* Insufficient Credits Modal */}
      {showLowBalanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl text-center border border-gray-100 overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-red-500 animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Wallet Empty</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Your AI usage credits have been exhausted. To continue your conversation, please contact your account administrator.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowLowBalanceModal(false)}
                className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200"
              >
                Understood
              </button>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Admin Support Required
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Scraping Guide Modal */}
      {showScrapingGuide && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" /> Adding Context Links
              </h3>
              <button onClick={() => setShowScrapingGuide(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Copy the URL</p>
                  <p className="text-xs text-gray-500">Copy the link of the website, Instagram profile, or LinkedIn page you want the AI to learn from.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Paste & Add</p>
                  <p className="text-xs text-gray-500">Paste it in the box and click the "+" button. The AI will scrape and structure the knowledge automatically.</p>
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3 h-3" /> Pro Tip: Social Media
                </p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  For Instagram and LinkedIn, ensure the profiles are <strong>public</strong>. Private profiles cannot be scraped.
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setShowScrapingGuide(false)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100">Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* First Time Disclaimer */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Info className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Welcome to your Expert Workspace</h3>
              <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                <p>To train your AI expert, use the <strong>Knowledge Base</strong> panel on the right.</p>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs font-medium text-amber-800">
                  ⚠️ Do NOT paste website or social media links directly into the chat. Use the dedicated "Add Website Context" section.
                </div>
                <p className="text-xs text-gray-400">This ensures the AI properly structures and remembers the data.</p>
              </div>
              <button 
                onClick={() => setShowDisclaimer(false)}
                className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scraper Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" /> Review Scraped Knowledge
                </h3>
                <p className="text-xs text-gray-500 mt-1">Review, edit, or adjust findings before saving to context.</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 items-start">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  The AI has extracted the following text from <strong>{pendingScrapeUrl}</strong>
                </p>
              </div>
              
              <textarea
                value={scrapedReviewText}
                onChange={(e) => setScrapedReviewText(e.target.value)}
                className="w-full h-[300px] p-6 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none transition-all text-sm text-gray-700 leading-relaxed font-medium custom-scrollbar"
                placeholder="Edit the scraped content here..."
              />
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
              <button 
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveScrapedText}
                disabled={isScrapingUrl}
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {isScrapingUrl ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Confirm & Add to Context</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}

      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />
    </div>
  );
};


const Shield = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
