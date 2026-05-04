
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../context/AppContext';
import { generateExpertResponse } from '../services/geminiService';
import { Send, ArrowLeft, Users, Bot, User, UserPlus, Link as LinkIcon, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DepartmentHub: React.FC = () => {
  const { clientData, activeDepartment, departmentHubs, addHubMessage, departmentDocuments } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [departmentHubs, activeDepartment]);

  if (!clientData || !activeDepartment) return null;

  const currentMessages = departmentHubs[activeDepartment] || [];
  const currentDocs = departmentDocuments[activeDepartment] || [];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const text = input;
    setInput('');

    // Check if AI is tagged
    const isAiTagged = text.toLowerCase().includes('@ai') || text.toLowerCase().includes('@expert');

    // 1. Add User Message
    addHubMessage(activeDepartment, {
      id: crypto.randomUUID(),
      sender: clientData.primary_contact || 'User',
      role: 'user',
      content: text,
      timestamp: Date.now()
    });

    if (isAiTagged) {
      setLoading(true);
      try {
        // Mapping last 5 hub messages to context:
        const historyContext = currentMessages.slice(-5).map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        }));

        const response = await generateExpertResponse(clientData, activeDepartment, text, historyContext, currentDocs);

        addHubMessage(activeDepartment, {
          id: crypto.randomUUID(),
          sender: 'Workmind AI',
          role: 'assistant',
          content: response.text,
          timestamp: Date.now()
        });

      } catch (error) {
        addHubMessage(activeDepartment, {
          id: crypto.randomUUID(),
          sender: 'System',
          role: 'assistant',
          content: 'AI Service Error',
          timestamp: Date.now(),
          isSystem: true
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInvite = () => {
    // Generate a mock invite link that actually works via URL params in App.tsx
    const origin = window.location.origin;
    const inviteLink = `${origin}?invite=${activeDepartment}`;

    navigator.clipboard.writeText(inviteLink).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    });
  };

  return (
    <div className="h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-neural-DEFAULT" />
              {activeDepartment} Hub
            </h2>
            <p className="text-xs text-gray-500">Team Collaboration Space • {currentDocs.length} Documents in Repo</p>
          </div>
        </div>

        <button
          onClick={handleInvite}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-50 text-neural-dark rounded-lg hover:bg-cyan-100 transition-colors font-medium text-sm"
        >
          {inviteCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
          {inviteCopied ? 'Link Copied!' : 'Invite Member'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="text-center text-gray-400 text-sm my-8">
          <p>Welcome to the {activeDepartment} Hub.</p>
          <p>Chat with your team here. Tag <span className="font-mono bg-gray-200 px-1 rounded">@AI</span> to get expert answers.</p>
        </div>

        {currentMessages.map(msg => {
          const isMe = msg.role === 'user';
          const isAi = msg.sender === 'Workmind AI';

          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAi ? 'bg-gradient-brand text-white' : 'bg-gray-300 text-gray-600'}`}>
                {isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={`max-w-[70%] rounded-xl p-4 ${isMe ? 'bg-gradient-brand text-white' : isAi ? 'bg-white border border-purple-200 shadow-sm' : 'bg-white shadow-sm'}`}>
                <div className={`text-xs font-bold mb-1 ${isMe ? 'text-cyan-bio' : 'text-gray-500'}`}>
                  {msg.sender}
                </div>
                {isAi ? (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center shrink-0 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
              <span className="text-xs text-gray-500 animate-pulse">Thinking... checking {currentDocs.length} documents...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-neural-DEFAULT outline-none"
            placeholder="Message the team... (Use @AI for help)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} className="bg-gradient-brand hover:opacity-90 text-white px-6 rounded-lg font-medium transition-colors shadow-md">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
