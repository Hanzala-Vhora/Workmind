
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { analyzeEmailThread } from '../services/geminiService';
import { X, Mail, CheckCircle, Copy, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const ThreadAnalyzer: React.FC<{ onClose: () => void; onApply: (draft: string) => void }> = ({ onClose, onApply }) => {
  const { clientData } = useApp();
  const [threadText, setThreadText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!clientData || !threadText.trim()) return;
    setLoading(true);
    try {
      const result = await analyzeEmailThread(clientData, threadText);
      setAnalysis(result);
    } catch (e) {
      alert("Analysis failed. Check API configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <Mail className="w-5 h-5 text-neural-DEFAULT" /> Thread-to-Decision
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
      </div>

      {!analysis ? (
        <div className="flex-1 flex flex-col">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">Paste an email thread below to get a summary, core issue, and draft response instantly.</p>
          <textarea 
            className="flex-1 w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-neural-DEFAULT outline-none resize-none text-sm mb-4 transition-all"
            placeholder="Paste email thread here..."
            value={threadText}
            onChange={e => setThreadText(e.target.value)}
          />
          <button 
            onClick={handleAnalyze}
            disabled={loading || !threadText}
            className="w-full bg-neural-dark text-white py-3 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2"
          >
            {loading ? 'Analyzing...' : <>Analyze Thread <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
             <h4 className="font-bold text-blue-900 text-sm mb-1">Summary</h4>
             <p className="text-blue-800 text-xs leading-relaxed">{analysis.summary}</p>
           </div>
           
           <div>
             <h4 className="font-bold text-gray-900 text-sm mb-2">Core Issue</h4>
             <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">{analysis.core_issue}</p>
           </div>

           <div>
              <h4 className="font-bold text-gray-900 text-sm mb-3">Strategic Options</h4>
              <div className="space-y-3">
                {analysis.options?.map((opt: any, i: number) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 hover:border-neural-DEFAULT/30 transition-colors bg-white shadow-sm">
                    <p className="font-bold text-sm text-gray-800">{opt.title}</p>
                    <p className="text-xs text-gray-500 mt-1 mb-2">{opt.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="text-green-700 bg-green-50 p-1.5 rounded font-medium">PRO: {opt.pros}</div>
                      <div className="text-red-700 bg-red-50 p-1.5 rounded font-medium">CON: {opt.cons}</div>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div>
             <div className="flex justify-between items-center mb-2">
               <h4 className="font-bold text-gray-900 text-sm">Draft Response</h4>
               <button 
                  onClick={() => navigator.clipboard.writeText(analysis.draft_response)}
                  className="text-neural-DEFAULT hover:text-neural-dark flex items-center gap-1 text-xs font-medium" 
                  title="Copy"
               >
                 <Copy className="w-3 h-3" /> Copy
               </button>
             </div>
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap font-mono mb-4 shadow-inner">
               {analysis.draft_response}
             </div>
             
             <button 
               onClick={() => onApply(analysis.draft_response)} 
               className="w-full bg-gradient-brand text-white py-3 rounded-xl font-bold shadow-lg shadow-cyan-electric/20 hover:shadow-cyan-electric/40 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
             >
                <CheckCircle className="w-5 h-5" /> Use This Response
             </button>
           </div>
           
           <button onClick={() => setAnalysis(null)} className="w-full text-gray-400 py-2 text-xs hover:text-gray-600 transition-colors">
             Discard & Analyze Another
           </button>
        </div>
      )}
    </div>
  );
};
