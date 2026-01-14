
'use client';
import { useState } from 'react';
import { Upload, FileText, StickyNote, Plus } from 'lucide-react';

export default function Repository() {
  const [activeTab, setActiveTab] = useState<'files' | 'notes'>('notes');

  // This would communicate with an API to save notes/files
  const handleCreateNote = () => {
    // Mock open modal
    const title = prompt("Note Title:");
    const content = prompt("Note Content:");
    if(title && content) {
      // POST /api/repository { type: 'note', title, content }
      alert("Note saved to Context Repository.");
    }
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Context Repository</h1>
          <p className="text-gray-500">Upload documents or add notes. Agents utilize this as their primary truth.</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
             <Upload className="w-4 h-4" /> Upload File
           </button>
           <button onClick={handleCreateNote} className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-lightTeal">
             <Plus className="w-4 h-4" /> Add Note
           </button>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-4 font-medium text-sm ${activeTab === 'notes' ? 'border-b-2 border-brand-teal text-brand-teal' : 'text-gray-500'}`}
          >
            Notes & Snippets
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            className={`px-6 py-4 font-medium text-sm ${activeTab === 'files' ? 'border-b-2 border-brand-teal text-brand-teal' : 'text-gray-500'}`}
          >
            Files (PDF/Docs)
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'notes' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mock Items */}
              <div className="p-4 border rounded-lg hover:border-brand-teal cursor-pointer group">
                 <div className="flex justify-between items-start mb-2">
                   <StickyNote className="w-5 h-5 text-yellow-500" />
                   <span className="text-xs text-gray-400">Pinned</span>
                 </div>
                 <h3 className="font-bold text-gray-800 group-hover:text-brand-teal">Q3 Strategy Goals</h3>
                 <p className="text-xs text-gray-500 mt-2 line-clamp-3">Focus on enterprise retention...</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No files uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
