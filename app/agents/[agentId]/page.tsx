
'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AgentChat() {
  const params = useParams();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch thread history on mount (Mocked simplified fetch for this file)
  useEffect(() => {
    // Ideally fetch from /api/threads/[threadId]
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMsg = { role: 'user', content: input } as Message;
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      // Assuming we created a default thread or pass a threadId query param
      // For demo, we might need to create a thread first if none exists
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'cl_mock_ws_id', // In real app, get from context/session
          agentId: params.agentId,
          threadId: 'cl_mock_thread_id', // In real app, manage thread creation
          message: newMsg.content
        })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error communicating with agent." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b bg-brand-bg flex justify-between items-center">
        <h2 className="font-bold text-brand-navy flex items-center gap-2">
          <Bot className="w-5 h-5 text-brand-teal" /> Agent Expert
        </h2>
        <span className="text-xs px-2 py-1 bg-brand-purple text-white rounded">Layer 1 Active</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
           <div className="text-center text-gray-400 mt-20">
             <p>Start a conversation with your expert.</p>
             <p className="text-xs mt-2">I have access to your repository and intake context.</p>
           </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-lg whitespace-pre-wrap ${m.role === 'user' ? 'bg-brand-navy text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
              <div className="text-xs opacity-50 mb-1 uppercase font-bold">{m.role}</div>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-2 text-gray-500">
               <Loader2 className="w-4 h-4 animate-spin" /> Thinking... checking repository...
             </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-brand-teal outline-none"
            placeholder="Ask your expert..."
          />
          <button onClick={handleSend} disabled={loading} className="bg-brand-teal text-white p-3 rounded-lg hover:bg-brand-lightTeal transition-all">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
