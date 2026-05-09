
import React, { useState, useEffect, useRef } from 'react';
import { Book, Plus, StickyNote, FileText, Trash2, Loader2, Globe, Database, FilePlus, ChevronRight, AlertTriangle, Shield, CheckCircle, X } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { authFetch } from '../lib/auth';
import { StoredDocument } from '../types';

export const KnowledgeBase: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedCategory, setSelectedCategory] = useState<'general' | 'template' | 'sop'>('general');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [scrapedReviewText, setScrapedReviewText] = useState('');
  const [pendingScrapeUrl, setPendingScrapeUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);


  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchGlobalDocuments = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await authFetch(`${API_URL}/api/documents/department/Universal?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch global documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalDocuments();
  }, [user?.id]);

  const handleAddNote = async () => {
    if (!noteInput.trim() || !user?.id) return;
    setIsSubmittingNote(true);
    try {
      // We'll use the upload endpoint but send a text blob
      const blob = new Blob([noteInput], { type: 'text/plain' });
      const file = new File([blob], `Note_${new Date().toISOString().split('T')[0]}.txt`, { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('department', 'Universal');
      formData.append('userId', user.id);
      formData.append('chatId', 'global-knowledge-base');
      formData.append('category', selectedCategory);


      const res = await authFetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setNoteInput('');
        fetchGlobalDocuments();
      }
    } catch (err) {
      console.error("Failed to add note", err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    
    if (file.size > 100 * 1024 * 1024) {
      alert(`File ${file.name} is too large. Max limit is 100MB.`);
      return;
    }

    setUploadStatus('uploading');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('department', 'Universal');
      formData.append('userId', user.id);
      formData.append('chatId', 'global-knowledge-base');
      formData.append('category', selectedCategory);


      const res = await authFetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setUploadStatus('success');
        fetchGlobalDocuments();
        setTimeout(() => setUploadStatus('idle'), 2000);
      } else {
        setUploadStatus('error');
      }
    } catch (err) {
      console.error("Upload failed", err);
      setUploadStatus('error');
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim() || !user?.id) return;
    setIsScrapingUrl(true);
    try {
      const res = await authFetch(`${API_URL}/api/upload/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput,
          chatId: 'global-knowledge-base',
          userId: user.id,
          department: 'Universal',
          dryRun: true,
          category: selectedCategory
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.dryRun) {
            setScrapedReviewText(data.scrapedText);
            setPendingScrapeUrl(data.url);
            setShowReviewModal(true);
            setUrlInput('');
        } else {
            setUrlInput('');
            fetchGlobalDocuments();
        }
      } else {

        const errorData = await res.json();
        alert(`Failed to extract context: ${errorData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("URL scraping failed", err);
      alert("Failed to extract context from URL.");
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleSaveScrapedText = async () => {
    if (!user?.id) return;
    setIsScrapingUrl(true);
    try {
      const res = await authFetch(`${API_URL}/api/upload/save-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: 'global-knowledge-base',
          userId: user.id,
          department: 'Universal',
          filename: pendingScrapeUrl,
          content: scrapedReviewText,
          category: selectedCategory
        })
      });

      if (!res.ok) throw new Error("Failed to save reviewed text");
      
      setShowReviewModal(false);
      setScrapedReviewText('');
      fetchGlobalDocuments();
    } catch (err) {
      console.error(err);
      alert("Error saving text");
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleDelete = async (docId: string, docName: string) => {

    if (!confirm(`Delete ${docName}?`)) return;
    try {
      await authFetch(`${API_URL}/api/upload?chatId=global-knowledge-base&filename=${encodeURIComponent(docName)}&userId=${user?.id}`, {
        method: 'DELETE'
      });
      fetchGlobalDocuments();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="mt-12 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-deepTech-DEFAULT flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-bio" />
            Global Knowledge Base
          </h3>
          <p className="text-ui-slate text-sm">Information accessible to all AI Experts</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
          <Database className="w-3 h-3" />
          Universal Context Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Actions & Notes */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-bold text-ui-text mb-4 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-500" />
              Add Quick Note
            </h4>
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Type a company rule, style guide, or general info..."
              className="w-full h-32 p-3 text-sm border border-gray-100 rounded-xl focus:ring-2 focus:ring-neural-DEFAULT/20 focus:border-neural-DEFAULT outline-none transition-all resize-none bg-gray-50/50"
            />
            <button
              onClick={handleAddNote}
              disabled={isSubmittingNote || !noteInput.trim()}
              className="w-full mt-3 bg-gradient-brand text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-cyan-bio/20 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isSubmittingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save to Global Context
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-bold text-ui-text mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-electric" />
              Add Website Context
            </h4>
            <div className="flex gap-2 items-center mb-3">
                <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="text-[10px] bg-white border border-gray-200 rounded px-2 py-1 font-bold text-gray-600 focus:border-neural-DEFAULT outline-none"
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
                className="flex-1 px-3 py-2 text-sm border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-neural-DEFAULT/20 focus:border-neural-DEFAULT transition-all bg-gray-50/50"
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
            <p className="text-[10px] text-gray-400 mt-2 italic">Scrapes text for AI knowledge</p>
          </div>

          <div className="bg-indigo-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-800">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-indigo-100">
              <Book className="w-4 h-4 text-cyan-400" />
              Why Global?
            </h4>
            <p className="text-xs text-indigo-100/80 leading-relaxed mb-4">
              Documents uploaded here are used as "absolute truth" by every expert. 
              Upload your company mission, tone of voice, or general guidelines to ensure consistency across all departments.
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white text-indigo-900 hover:bg-indigo-50 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {uploadStatus === 'uploading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FilePlus className="w-3 h-3" />}
              {uploadStatus === 'success' ? 'Uploaded!' : 'Upload Documents'}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          </div>
        </div>

        {/* Right: Knowledge List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Global Files & Notes</span>
              <span className="bg-white px-2 py-0.5 rounded border border-gray-100 text-[10px] font-bold text-gray-400">{documents.length} Items</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto max-h-[500px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-neural-DEFAULT" />
                </div>
              ) : documents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Database className="w-8 h-8 text-gray-200" />
                  </div>
                  <h5 className="text-sm font-bold text-gray-400">Knowledge Base is Empty</h5>
                  <p className="text-xs text-gray-300 mt-1 max-w-[200px]">Add notes or files to populate your global context.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="group bg-white p-4 rounded-xl border border-gray-50 hover:border-neural-DEFAULT hover:shadow-md transition-all flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${doc.name.endsWith('.txt') ? 'bg-amber-50 text-amber-600' : 'bg-cyan-50 text-cyan-600'}`}>
                        {doc.name.endsWith('.txt') ? <StickyNote className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-ui-text truncate" title={doc.name}>{doc.name}</p>
                          {doc.category && doc.category !== 'general' && (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                              doc.category === 'template' ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-teal-100 text-teal-600 border border-teal-200'
                            }`}>
                              {doc.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                          <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                          Global
                        </p>
                      </div>

                      <button 
                        onClick={() => handleDelete(doc.id, doc.name)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50/50 border-t border-gray-50">
              <button className="text-xs font-bold text-neural-DEFAULT flex items-center gap-1 hover:gap-2 transition-all">
                Manage all repository assets <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scraper Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                  <Shield className="w-5 h-5 text-indigo-600" /> Review Scraped Knowledge
                </h3>
                <p className="text-[10px] md:text-xs text-gray-500 mt-1">Review, edit, or adjust findings before saving to Global context.</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 items-start">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] md:text-xs text-amber-800 font-medium leading-relaxed">
                  The AI has extracted the following text from <strong>{pendingScrapeUrl}</strong>. Please ensure no private data or irrelevant clutter is included.
                </p>
              </div>
              
              <textarea
                value={scrapedReviewText}
                onChange={(e) => setScrapedReviewText(e.target.value)}
                className="w-full h-[250px] md:h-[300px] p-4 md:p-6 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-neural-DEFAULT outline-none transition-all text-xs md:text-sm text-gray-700 leading-relaxed font-medium custom-scrollbar"
                placeholder="Edit the scraped content here..."
              />
            </div>

            <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
              <button 
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 md:py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-xs md:text-sm hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveScrapedText}
                disabled={isScrapingUrl}
                className="flex-[2] py-3 md:py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs md:text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {isScrapingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Save to Global Context</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};
