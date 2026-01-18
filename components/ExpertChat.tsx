import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For tables
import { useApp } from '../context/AppContext';
import { Send, ArrowLeft, AlertTriangle, Paperclip, FileText, Image as ImageIcon, Database, X, Zap, Loader2, CheckCircle, File, User, Sparkles } from 'lucide-react';
import { ThreadAnalyzer } from './ThreadAnalyzer';
import { BrainLogo } from './BrainLogo';
import { StoredDocument } from '../types';
import { useNavigate } from 'react-router-dom';

export const ExpertChat: React.FC = () => {
  const { clientData, activeDepartment, conversations, addMessage, departmentDocuments, addDocument, setConversationMessages } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState('');

  // Get API URL from environment
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showContextRepo, setShowContextRepo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, activeDepartment]);

  // Fetch history from server
  useEffect(() => {
    if (!activeDepartment) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/chat/${activeDepartment}`);
        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();
        if (data.history) {
          setConversationMessages(activeDepartment, data.history);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };

    fetchHistory();
  }, [activeDepartment]);

  if (!clientData || !activeDepartment) return null;

  const currentMessages = conversations[activeDepartment]?.messages || [];
  const currentDocs = departmentDocuments[activeDepartment] || [];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setLoading(true);

    // Optimistically add user message
    addMessage(activeDepartment, 'user', userText);

    try {
      try {
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientData,
            department: activeDepartment,
            userMessage: userText,
            contextDocs: currentDocs
          })
        });

        if (!res.ok) throw new Error("API call failed");

        const response = await res.json();

        // Add assistant message
        addMessage(activeDepartment, 'assistant', response.text, response.escalation);
      } catch (error) {
        console.error(error);
        addMessage(activeDepartment, 'assistant', "Error: Unable to reach the expert engine. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    const handleApplyDraft = (draft: string) => {
      setInput(draft);
      setShowAnalyzer(false);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);

      // Limit size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Max limit is 5MB.");
        setUploading(false);
        return;
      }

      const reader = new FileReader();
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isBinary = isImage || isPdf;

      reader.onload = (e) => {
        const content = e.target?.result;
        if (!content) {
          setUploading(false);
          return;
        }

        const newDoc: StoredDocument = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type || (isPdf ? 'application/pdf' : 'text/plain'),
          content: content as string,
          uploadedAt: Date.now()
        };

        try {
          addDocument(activeDepartment, newDoc);
          setShowContextRepo(true); // Open sidebar to show success
        } catch (err) {
          console.error("Failed to add document", err);
          alert("Failed to save document. Please try again.");
        } finally {
          setUploading(false);
          // Reset input to allow uploading same file again if needed
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.onerror = () => {
        alert("Error reading file.");
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };

      if (isBinary) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    };

    return (
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BrainLogo width={24} height={24} />
                {activeDepartment} Expert
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-brand-teal" /> AI Powered</span>
                <span>•</span>
                <span>{clientData.business_name}</span>
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
                    <div key={doc.id || idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-start gap-3 hover:border-neural-DEFAULT hover:shadow-md transition-all cursor-default">
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
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-midnight-DEFAULT hover:bg-neural-dark text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-midnight-DEFAULT/20 disabled:opacity-70 disabled:cursor-wait"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  {uploading ? 'Uploading...' : 'Upload Document'}
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
            accept=".pdf,.txt,.md,.json,.csv,.png,.jpg,.jpeg"
          />

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white w-full relative">
            <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
              <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {currentMessages.length === 0 && (
                  <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400 select-none animate-fadeIn">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-3xl mb-8 flex items-center justify-center shadow-sm">
                      <BrainLogo width={64} height={64} className="opacity-80" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">How can I help with {activeDepartment}?</h3>
                    <p className="text-gray-500 max-w-md text-center">
                      I'm trained on your company's documents and guidelines. Ask me anything about processes, contracts, or strategies.
                    </p>
                  </div>
                )}

                {currentMessages.map((msg, idx) => (
                  <div key={msg.id || idx} className={`group animate-fadeIn flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-gray-200' : 'bg-indigo-50 border border-indigo-100'}`}>
                      {msg.role === 'user' ? (
                        <User className="w-5 h-5 text-gray-600" />
                      ) : (
                        <BrainLogo width={20} height={20} />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div className={`relative px-5 py-4 ${msg.role === 'user'
                        ? 'bg-gray-100 text-gray-800 rounded-2xl rounded-tr-sm'
                        : 'text-gray-800' // Assistant messages have no background, just text
                        }`}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-indigo-600 prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-table:border-collapse prose-th:border prose-th:border-gray-200 prose-th:bg-gray-50 prose-th:p-2 prose-td:border prose-td:border-gray-200 prose-td:p-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
              <div className="max-w-3xl mx-auto relative group">
                <div className="relative bg-gray-50 rounded-2xl border border-gray-200 shadow-sm focus-within:shadow-md focus-within:ring-1 focus-within:ring-indigo-100 focus-within:border-indigo-200 transition-all overflow-hidden hover:border-gray-300">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={`Ask ${activeDepartment} expert...`}
                    className="w-full pl-4 pr-24 py-4 bg-transparent outline-none resize-none text-gray-800 placeholder-gray-400 text-base"
                    rows={1}
                    style={{ minHeight: '56px', maxHeight: '200px' }}
                  />

                  {/* Actions */}
                  <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Upload Context"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className={`p-2 rounded-lg transition-all ${input.trim() && !loading
                        ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="text-center mt-3">
                  <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    AI can make mistakes. Verify critical information.
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
    );
  };

  const Shield = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
