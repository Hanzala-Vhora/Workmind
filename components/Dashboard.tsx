
import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Globe, BarChart3, Server, ShoppingCart, MessageSquare, Briefcase, Zap, LogOut, Layout, Workflow, Plus } from 'lucide-react';
import { Department } from '../types';
import { BrainLogo } from './BrainLogo';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';

const DEPT_ICONS: Record<Department, any> = {
  'Sales': Briefcase,
  'Marketing': Globe,
  'Finance': BarChart3,
  'Operations': Workflow,
  'HR': Users,
  'IT': Server,
  'Social Media': MessageSquare,
  'Procurement': ShoppingCart
};

export const Dashboard: React.FC = () => {
  const { clientData, setActiveDepartment, resetApp } = useApp();
  const navigate = useNavigate();
  const { signOut } = useClerk();

  if (!clientData) return null;

  const handleNav = (dept: Department, view: 'chat' | 'hub') => {
    setActiveDepartment(dept);
    navigate(`/${view}`);
  };

  const handleSignOut = async () => {
    resetApp();
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-ui-card flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-brand text-white hidden md:flex flex-col shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <BrainLogo width={30} height={30} className="text-white" />
          <h1 className="text-xl font-bold tracking-tight">WORKMIND.AI</h1>
        </div>
        <nav className="flex-1 px-4 space-y-4 mt-6 overflow-y-auto">
          <div className="text-xs font-semibold text-white/60 uppercase tracking-wider px-2">Your Experts</div>
          {clientData.selected_departments.map(dept => {
            const Icon = DEPT_ICONS[dept];
            return (
              <div key={dept} className="mb-2">
                <div className="px-3 py-1 text-white/80 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                  <Icon className="w-3 h-3" /> {dept}
                </div>
                <div className="pl-4 mt-1 space-y-1">
                  <button
                    onClick={() => handleNav(dept, 'chat')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-left text-sm text-white/90"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-electric" />
                    <span>Agent</span>
                  </button>
                  <button
                    onClick={() => handleNav(dept, 'hub')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-left text-sm text-white/90"
                  >
                    <Users className="w-3.5 h-3.5 text-cyan-bio" />
                    <span>Hub</span>
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => navigate('/add-expert')}
            className="w-full mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-sm font-bold text-white shadow-lg group"
          >
            <div className="bg-cyan-electric text-neural-dark rounded-full w-5 h-5 flex items-center justify-center">
              <Plus className="w-3 h-3 font-bold" />
            </div>
            New Expert
          </button>

        </nav>
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              {clientData.primary_contact.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{clientData.business_name}</p>
              <p className="text-[10px] text-white/60 truncate uppercase">{clientData.stage}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="mt-2 flex items-center gap-2 text-xs text-white/60 hover:text-white w-full px-2 py-1 rounded hover:bg-white/5 transition-colors">
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-deepTech-DEFAULT">Enterprise Dashboard</h2>
            <p className="text-ui-slate">Overview for {clientData.business_name}</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-sm flex items-center gap-2">
              <span className="text-gray-500">Revenue Goal:</span> <span className="font-bold text-green-600">{clientData.revenue_target_90d}</span>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-sm mb-1">Active Workspaces</div>
            <div className="text-3xl font-bold text-ui-text">{clientData.selected_departments.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-sm mb-1">Context Docs</div>
            <div className="text-3xl font-bold text-ui-text">0</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-sm mb-1">Est. Time Saved</div>
            <div className="text-3xl font-bold text-ui-text">0h</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-sm mb-1">System Status</div>
            <div className="text-3xl font-bold text-green-500 flex items-center gap-2">Online <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span></div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-deepTech-DEFAULT mb-6">Department Workspaces</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientData.selected_departments.map(dept => {
            const Icon = DEPT_ICONS[dept];
            return (
              <div key={dept} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-bio/10 flex items-center justify-center text-neural-DEFAULT group-hover:bg-gradient-brand group-hover:text-white transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="bg-cyan-50 text-neural-dark text-xs px-2 py-1 rounded-full font-medium border border-cyan-100">Active</span>
                </div>
                <h4 className="text-lg font-bold text-ui-text mb-1">{dept} Workspace</h4>
                <p className="text-ui-slate text-sm mb-6 line-clamp-2">
                  Access expert agents, team collaboration, and document repository.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleNav(dept, 'chat')} className="bg-gray-50 text-ui-text font-semibold py-2 rounded-lg hover:bg-neural-DEFAULT hover:text-white transition-all flex items-center justify-center gap-2 text-sm border border-gray-100 hover:border-transparent">
                    <Zap className="w-4 h-4" /> Agent
                  </button>
                  <button onClick={() => handleNav(dept, 'hub')} className="bg-gray-50 text-ui-text font-semibold py-2 rounded-lg hover:bg-midnight-DEFAULT hover:text-white transition-all flex items-center justify-center gap-2 text-sm border border-gray-100 hover:border-transparent">
                    <Users className="w-4 h-4" /> Hub
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  );
};
