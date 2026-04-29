import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For tables
import rehypeRaw from 'rehype-raw'; // For HTML tags like <br>
import { useApp } from '../context/AppContext';
import { Send, ArrowLeft, AlertTriangle, Paperclip, FileText, Image as ImageIcon, Database, X, Zap, Loader2, CheckCircle, File, User, Sparkles, MessageSquare, Menu, Plus, Trash2, ChevronDown, Cpu } from 'lucide-react';
import { ThreadAnalyzer } from './ThreadAnalyzer';
import { BrainLogo } from './BrainLogo';
import { StoredDocument } from '../types';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

export const ExpertChat: React.FC = () => {
  const { user } = useUser();
  const { clientData, activeDepartment, setActiveDepartment, conversations, addMessage, departmentDocuments, addDocument, removeDocument, setConversationMessages } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [chats, setChats] = useState<{ id: string; title: string; createdAt: number }[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [fetchedDocuments, setFetchedDocuments] = useState<StoredDocument[]>([]);

  const MODELS = [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude 3.5 Sonnet', provider: 'claude' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  ];
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [showModelMenu, setShowModelMenu] = useState(false);

  // Get API URL from environment
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showContextRepo, setShowContextRepo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, activeDepartment, messages]);

  const [chatsLoading, setChatsLoading] = useState(false);

  // Fetch history from server
  // Fetch department chats on department change
  useEffect(() => {
    if (!activeDepartment || !user?.id) return;

    const fetchChats = async () => {
      try {
        setChatsLoading(true);
        const res = await fetch(`${API_URL}/api/chat/department/${activeDepartment}?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setChats(data.chats || []);
          setCurrentChatId(null);
          setMessages([]);
          setFetchedDocuments([]);
        }
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
        const res = await fetch(`${API_URL}/api/chat/session/${currentChatId}?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.history || []);
          setFetchedDocuments(data.documents || []);
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
        const res = await fetch(`${API_URL}/api/settings/ai-config`);
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
    const res = await fetch(`${API_URL}/api/chat/department/${activeDepartment}?userId=${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setChats(data.chats || []);
    }
  };

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      await fetch(`${API_URL}/api/chat/session/${chatId}?userId=${user.id}`, { method: 'DELETE' });
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
        setFetchedDocuments([]);
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
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientData,
          department: activeDepartment,
          userMessage: userText,
          contextDocs: currentDocs,
          chatId: currentChatId, // Pass current ID if exists
          userId: user.id,
          modelProvider: selectedModel.provider,
          model: selectedModel.id
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

        // Limit size to 500MB per file
        if (file.size > 500 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Max limit is 500MB.`);
          continue;
        }

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('chatId', attachChatId);
          formData.append('userId', user.id);
          formData.append('department', activeDepartment);

          const res = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
          });

          if (!res.ok) {
            console.error(`Upload failed for ${file.name}`);
            continue;
          }

          // Add reference doc to context
          const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

          const newDoc: StoredDocument = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Ensure unique ID
            name: file.name,
            type: file.type || (isPdf ? 'application/pdf' : 'text/plain'),
            content: isPdf ? "[Uploaded to Server - Processed]" : "Image/Text File",
            uploadedAt: Date.now(),
            chatId: attachChatId,
            pageCount: undefined
          };

          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
              newDoc.content = e.target?.result as string;
              // addDocument(activeDepartment, newDoc); // No longer use context
              setFetchedDocuments(prev => [...prev.filter(existing => existing.name !== newDoc.name), newDoc]);
              setShowContextRepo(true);
            };
          } else {
            // PDF / Text -> Rely on server chunks
            // addDocument(activeDepartment, newDoc); // No longer use context
            setFetchedDocuments(prev => [...prev.filter(existing => existing.name !== newDoc.name), newDoc]);
            setShowContextRepo(true);
          }
        } catch (err) {
          console.error(`Failed to upload ${file.name}`, err);
        }
      }

      await refreshChats();
      setShowContextRepo(true);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 2500);

    } catch (err) {
      console.error("General upload error", err);
      // alert("Failed to upload documents. Please try again.");
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (doc: StoredDocument) => {
    if (!confirm(`Delete ${doc.name}?`)) return;

    try {
      // If we have a chatId (which we usually do if we just uploaded), try to delete chunks
      // We need chatID. If document doesn't store chatId, we might try currentChatId.
      // However, our delete API takes chatId and filename.
      // If the doc was uploaded in PREVIOUS session, we might strictly lose track of chatId unless stored in doc.
      // But let's try currentChatId if available, or just remove from client state.

      if (currentChatId) {
        await fetch(`${API_URL}/api/upload?chatId=${doc.chatId || currentChatId}&filename=${encodeURIComponent(doc.name)}&userId=${user?.id}`, {
          method: 'DELETE'
        });
      }

      removeDocument(activeDepartment, doc.id); // clean context just in case
      setFetchedDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      console.error("Failed to delete document", err);
      // Fallback: remove from UI anyway
      setFetchedDocuments(prev => prev.filter(d => d.id !== doc.id));
    }
  };



  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Chats Sidebar */}
      <div className={`${showSidebar ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0'} flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Hub
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
            onClick={() => { setCurrentChatId(null); setMessages([]); setFetchedDocuments([]); }}
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
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              {clientData.business_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{clientData.business_name}</p>
              <p className="text-xs text-gray-500 truncate">Premium Plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 min-w-0 transition-all">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 md:hidden">
              <Menu className="w-5 h-5" />
            </button>
            {!showSidebar && (
              <button onClick={() => setShowSidebar(true)} className="hidden md:block p-2 hover:bg-gray-100 rounded-lg text-gray-500 mr-2" title="Open Sidebar">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors md:hidden">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BrainLogo width={24} height={24} />
                {activeDepartment} Expert
              </h2>

              {/* Model Selector */}
              <div className="relative ml-2 hidden sm:block">
                <button
                  onClick={() => setShowModelMenu(!showModelMenu)}
                  className="flex items-center gap-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md transition-colors"
                >
                  <Cpu className="w-3 h-3" />
                  {selectedModel.name}
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {showModelMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowModelMenu(false)}></div>
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20 overflow-hidden">
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Select Model
                      </div>
                      {MODELS.map(m => (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedModel(m); setShowModelMenu(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${selectedModel.id === m.id ? 'text-indigo-600 font-medium' : 'text-gray-600'}`}
                        >
                          {selectedModel.id === m.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowContextRepo(!showContextRepo)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-all border flex items-center gap-2 ${showContextRepo ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'}`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Context</span>
              {currentDocs.length > 0 && <span className={`text-xs px-1.5 rounded-full ${showContextRepo ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>{currentDocs.length}</span>}
            </button>
            <button
              onClick={() => setShowAnalyzer(!showAnalyzer)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-all border ${showAnalyzer ? 'bg-indigo-600 text-white border-indigo-600' : 'text-indigo-600 bg-white hover:bg-indigo-50 border-indigo-200'}`}
            >
              {showAnalyzer ? 'Close' : 'Analyzer'}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Context Repository Sidebar */}
          {showContextRepo && (
            <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col z-10 shadow-xl transition-all">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Database className="w-4 h-4 text-midnight-DEFAULT" /> Knowledge Base
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
                      <div className="overflow-hidden flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate" title={doc.name}>{doc.name}</p>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                          <CheckCircle className="w-3 h-3 text-green-500" />
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
                  className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-midnight-DEFAULT/20 disabled:opacity-70 disabled:cursor-wait ${uploadStatus === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                    uploadStatus === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                      'bg-midnight-DEFAULT hover:bg-neural-dark text-white'
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
              </div>
            </div>
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
                        ? 'bg-[#f4f4f4] text-gray-900 rounded-3xl px-6 py-4 max-w-[85%]'
                        : 'text-gray-800 px-5 pt-1' // Added padding for assistant
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
                <div className="relative bg-[#f4f4f4] rounded-[26px] border border-transparent focus-within:border-gray-300 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-200 transition-all overflow-hidden shadow-sm hover:border-gray-300">
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
                    Workmind can make mistakes. Verify critical information.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Analyzer Side Panel */}
          {showAnalyzer && (
            <div className="w-[400px] border-l border-gray-200 bg-white shadow-2xl z-20 flex flex-col">
              <ThreadAnalyzer onClose={() => setShowAnalyzer(false)} onApply={handleApplyDraft} />
            </div>
          )}
        </div>

        {/* Simple Shield Icon for footer */}
        <div className="hidden">
          <Shield />
        </div>
      </div>
    </div >
  );
};

const Shield = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
