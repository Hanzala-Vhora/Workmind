
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../context/AppContext';
import { generateExpertResponse } from '../services/geminiService';
import { Send, ArrowLeft, AlertTriangle, Paperclip, FileText, Image as ImageIcon, Database, X, Zap, Loader2, CheckCircle, File } from 'lucide-react';
import { ThreadAnalyzer } from './ThreadAnalyzer';
import { StoredDocument } from '../types';
import { useNavigate } from 'react-router-dom';

export const ExpertChat: React.FC = () => {
  const { clientData, activeDepartment, conversations, addMessage, departmentDocuments, addDocument } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
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

  if (!clientData || !activeDepartment) return null;

  const currentMessages = conversations[activeDepartment]?.messages || [];
  const currentDocs = departmentDocuments[activeDepartment] || [];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setLoading(true);

    addMessage(activeDepartment, 'user', userText);

    try {
      const response = await generateExpertResponse(clientData, activeDepartment, userText, currentMessages, currentDocs);
      addMessage(activeDepartment, 'assistant', response.text, response.escalation);
    } catch (error) {
      addMessage(activeDepartment, 'assistant', "Error: Unable to reach the expert engine. Please check your API key.");
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
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-20 relative">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-ui-text flex items-center gap-2">
              {activeDepartment} Expert
              <span className="bg-neural-DEFAULT text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-sm">AI</span>
            </h2>
            <p className="text-xs text-gray-500">Trained on {clientData.business_name} • Priority: {clientData.department_configs[activeDepartment]?.priority || 'Normal'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowContextRepo(!showContextRepo)}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all border flex items-center gap-2 shadow-sm ${showContextRepo ? 'bg-midnight-DEFAULT text-white border-midnight-DEFAULT' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'}`}
          >
            <Database className="w-4 h-4" />
            Context Repo
            {currentDocs.length > 0 && <span className={`text-xs px-1.5 rounded-full ${showContextRepo ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>{currentDocs.length}</span>}
          </button>
          <button
            onClick={() => setShowAnalyzer(!showAnalyzer)}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all border shadow-sm ${showAnalyzer ? 'bg-deepTech-DEFAULT text-white border-deepTech-DEFAULT' : 'text-deepTech-DEFAULT bg-white hover:bg-blue-50 border-deepTech-DEFAULT/20'}`}
          >
            {showAnalyzer ? 'Close Analyzer' : 'Email Analyzer'}
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
        <div className="flex-1 flex flex-col bg-white w-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {currentMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 pointer-events-none select-none">
                <div className="w-20 h-20 bg-gray-100 rounded-full mb-6 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-500">Start a conversation</h3>
                <p className="text-sm text-gray-400 mt-1">Your {activeDepartment} Expert is ready.</p>
                {currentDocs.length > 0 && <p className="text-xs mt-4 bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">{currentDocs.length} knowledge source(s) active</p>}
              </div>
            )}

            {currentMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-5 shadow-sm ${msg.role === 'user' ? 'bg-gradient-brand text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-slate max-w-none break-words">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}

                  {msg.escalation?.required && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-yellow-800">Approval Required</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Trigger: <span className="font-mono bg-yellow-100 px-1 rounded">"{msg.escalation.reason}"</span>.
                          Escalated to: {msg.escalation.approver || 'Department Head'}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white px-6 py-4 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-neural-DEFAULT rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-neural-DEFAULT rounded-full animate-bounce delay-150"></span>
                  <span className="w-2 h-2 bg-neural-DEFAULT rounded-full animate-bounce delay-300"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-gray-200">
            <div className="max-w-4xl mx-auto relative group">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Ask your ${activeDepartment} expert...`}
                className="w-full pl-5 pr-24 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-neural-DEFAULT focus:border-transparent focus:ring-4 focus:ring-neural-DEFAULT/10 outline-none resize-none shadow-inner transition-all text-sm"
                rows={1}
                style={{ minHeight: '60px' }}
              />

              {/* Quick Actions in Input */}
              <div className="absolute right-3 top-3 flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-neural-DEFAULT hover:bg-gray-100 transition-all rounded-xl"
                  title="Upload Document"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="p-2 bg-gradient-brand text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="text-center mt-3 text-xs text-gray-400 flex justify-center items-center gap-2">
              <Shield className="w-3 h-3 text-neural-DEFAULT" />
              <span><strong className="text-gray-600">No Hallucination Guarantee:</strong> Responses strictly grounded in provided context.</span>
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
