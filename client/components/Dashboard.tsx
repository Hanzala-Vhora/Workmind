
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Globe, BarChart3, Server, ShoppingCart, MessageSquare, Briefcase, Zap, LogOut, Layout, Workflow, Plus, Loader, RefreshCw, Menu, X } from 'lucide-react';
import { Department, IntakeData } from '../types';
import { BrainLogo } from './BrainLogo';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { INITIAL_DATA } from './IntakeForm';

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
  const { clientData, setClientData, setActiveDepartment, resetApp, userProfile } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isLoaded, signOut } = useAuth();

  const [intakeForms, setIntakeForms] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch intake forms from backend
  const fetchIntakeForms = async () => {
    try {
      setRefreshing(true);
      if (user?.id) {
        const forms = await apiClient.intakeForms.getAll({ userId: user.id });
        setIntakeForms(forms);
        console.log('✅ Fetched intake forms:', forms);
      } else {
        const workspaceId = clientData?.business_name || 'workspace-default';
        const forms = await apiClient.intakeForms.getAll(workspaceId);
        setIntakeForms(forms);
        console.log('✅ Fetched intake forms:', forms);
      }
    } catch (error) {
      console.error('❌ Error fetching intake forms:', error);
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    if (!isLoaded || !user) return;

    if (clientData) {
      fetchIntakeForms();
    } else {
      const restoreSession = async () => {
        try {
          const status = await apiClient.users.checkOnboardingStatus(user.id);

          if (status.completed && status.formId) {
            const form = await apiClient.intakeForms.getById(status.formId);

            const restoredData: IntakeData = {
              ...INITIAL_DATA,
              business_name: form.companyName,
              primary_contact: form.contactEmail,
              industry: form.industry,
              stage: form.companySize as any,
              selected_departments: form.department ? [form.department as Department] : [],
              main_offer: form.currentState || '',
              revenue_streams: form.mainGoals?.[0] || '',
              broken_workflows: form.challenges?.[0] || '',
              team_structure: form.resources || '',
              sales_cycle: form.timeline as any || '1-3 months',
              revenue_target_12m: form.budget || '',
            };

            setClientData(restoredData);
          } else {
            navigate('/intake');
          }
        } catch (error) {
          console.error("Failed to restore session:", error);
          navigate('/intake');
        }
      };

      restoreSession();
    }
  }, [clientData, navigate, isLoaded, user, setClientData]);

  const handleSwitchAndNav = (form: any, dept: Department, view?: 'chat' | 'hub') => {
    // 1. Switch Client Data
    const restoredData: IntakeData = {
      ...INITIAL_DATA,
      business_name: form.companyName,
      primary_contact: form.contactEmail,
      industry: form.industry,
      stage: form.companySize as any,
      selected_departments: form.department ? [form.department as Department] : [],
      main_offer: form.currentState || '',
      revenue_streams: form.mainGoals?.[0] || '',
      broken_workflows: form.challenges?.[0] || '',
      team_structure: form.resources || '',
      sales_cycle: form.timeline as any || '1-3 months',
      revenue_target_12m: form.budget || '',
    };
    setClientData(restoredData);
    setActiveDepartment(dept);

    // 2. Navigate
    if (view) {
      navigate(`/${view}`);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSignOut = async () => {
    resetApp();
    await signOut();
    navigate('/');
  };

  if (!clientData) return null;

  return (
    <div className="min-h-screen bg-ui-card flex relative">
      {/* Mobile Hamburger Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-gradient-brand text-white rounded-lg shadow-lg"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-gradient-brand text-white transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <BrainLogo width={30} height={30} className="text-white" />
          <h1 className="text-xl font-bold tracking-tight">WORKMIND.AI</h1>
        </div>
        <nav className="flex-1 px-4 space-y-4 mt-6 overflow-y-auto">
          <div className="text-xs font-semibold text-white/60 uppercase tracking-wider px-2">Your Experts</div>
          {intakeForms.map(form => {
            const dept = (form.department as Department) || 'Sales';
            const Icon = DEPT_ICONS[dept] || Briefcase;
            const isActive = clientData.business_name === form.companyName && clientData.selected_departments.includes(dept);

            return (
              <div key={form.id} className={`mb-2 rounded-lg transition-all ${isActive ? 'bg-white/10' : ''}`}>
                <div onClick={() => { handleSwitchAndNav(form, dept); setIsMobileMenuOpen(false); }} className="px-3 py-2 text-white/90 text-sm font-bold flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded-lg">
                  <Icon className="w-4 h-4" />
                  <div className="flex flex-col leading-tight overflow-hidden">
                    <span>{dept}</span>
                    <span className="text-[10px] text-white/50 font-normal truncate">{form.companyName}</span>
                  </div>
                </div>

                <div className="pl-9 mt-1 space-y-1 pb-2">
                  <button
                    onClick={() => { handleSwitchAndNav(form, dept, 'chat'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-left text-xs text-white/70 hover:text-white hover:bg-white/10 ${isActive ? 'text-white' : ''}`}
                  >
                    <Zap className="w-3 h-3 text-cyan-electric" />
                    <span>Agent</span>
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => { navigate('/add-expert'); setIsMobileMenuOpen(false); }}
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
              {clientData.primary_contact?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.fullName || 'User'}</p>
              <p className="text-[10px] text-white/60 truncate uppercase">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="mt-2 flex items-center gap-2 text-xs text-white/60 hover:text-white w-full px-2 py-1 rounded hover:bg-white/5 transition-colors">
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-gradient-brand text-white hidden md:flex flex-col shadow-xl h-screen sticky top-0 overflow-hidden shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <BrainLogo width={30} height={30} className="text-white" />
          <h1 className="text-xl font-bold tracking-tight">WORKMIND.AI</h1>
        </div>
        <nav className="flex-1 px-4 space-y-4 mt-6 overflow-y-auto">
          <div className="text-xs font-semibold text-white/60 uppercase tracking-wider px-2">Your Experts</div>
          {intakeForms.map(form => {
            const dept = (form.department as Department) || 'Sales';
            const Icon = DEPT_ICONS[dept] || Briefcase;
            const isActive = clientData.business_name === form.companyName && clientData.selected_departments.includes(dept);

            return (
              <div key={form.id} className={`mb-2 rounded-lg transition-all ${isActive ? 'bg-white/10' : ''}`}>
                <div onClick={() => handleSwitchAndNav(form, dept)} className="px-3 py-2 text-white/90 text-sm font-bold flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded-lg">
                  <Icon className="w-4 h-4" />
                  <div className="flex flex-col leading-tight overflow-hidden">
                    <span>{dept}</span>
                    <span className="text-[10px] text-white/50 font-normal truncate">{form.companyName}</span>
                  </div>
                </div>

                {/* Actions (Only show if active or hovered - simplified to always show for access) */}
                <div className="pl-9 mt-1 space-y-1 pb-2">
                  <button
                    onClick={() => handleSwitchAndNav(form, dept, 'chat')}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-left text-xs text-white/70 hover:text-white hover:bg-white/10 ${isActive ? 'text-white' : ''}`}
                  >
                    <Zap className="w-3 h-3 text-cyan-electric" />
                    <span>Agent</span>
                  </button>
                  <button
                    onClick={() => handleSwitchAndNav(form, dept, 'hub')}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-left text-xs text-white/70 hover:text-white hover:bg-white/10 ${isActive ? 'text-white' : ''}`}
                  >
                    <Users className="w-3 h-3 text-cyan-bio" />
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

          {userProfile?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full mt-2 flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/20 transition-all text-sm font-bold text-white shadow-lg group"
            >
              <div className="bg-white text-indigo-600 rounded-full w-5 h-5 flex items-center justify-center">
                <Layout className="w-3 h-3 font-bold" />
              </div>
              Admin Panel
            </button>
          )}

        </nav>
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              {clientData.primary_contact?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.fullName || 'User'}</p>
              <p className="text-[10px] text-white/60 truncate uppercase">{user?.email}</p>
            </div>
          </div>

          {/* Wallet / Credits Section */}
          <div className="mt-4 px-2">
            <div className={`rounded-xl p-3 text-white shadow-sm transition-all ${userProfile?.credits <= 0 ? 'bg-red-600' : 'bg-gray-900/90 border border-white/10'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Credits Balance</span>
                <Zap className={`w-3 h-3 ${userProfile?.credits <= 0 ? 'text-white animate-pulse' : 'text-amber-400 fill-amber-400'}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white">{userProfile?.credits?.toFixed(1) || '0.0'}</span>
              </div>
              {userProfile?.credits <= 0 && (
                <p className="text-[9px] mt-2 font-bold bg-black/20 p-1.5 rounded leading-tight border border-white/10 text-center">
                  WALLET EMPTY. CONTACT ADMIN.
                </p>
              )}
            </div>
          </div>
          <button onClick={handleSignOut} className="mt-2 flex items-center gap-2 text-xs text-white/60 hover:text-white w-full px-2 py-1 rounded hover:bg-white/5 transition-colors">
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 mt-12 md:mt-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-deepTech-DEFAULT">Enterprise Dashboard</h2>
            <p className="text-ui-slate text-sm md:text-base">Manage your AI workforce</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-sm flex items-center gap-2 w-full md:w-auto justify-center md:justify-start">
            <RefreshCw onClick={fetchIntakeForms} className={`w-4 h-4 text-gray-400 cursor-pointer hover:text-neural-DEFAULT ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-gray-500">Status:</span> <span className="font-bold text-green-600">Online</span>
          </div>
        </header>

        {refreshing && intakeForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader className="w-10 h-10 animate-spin text-neural-DEFAULT mb-3" />
            <p className="text-sm font-medium">Loading Workspace...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Active Experts</div>
                <div className="text-3xl font-bold text-ui-text">{intakeForms.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Total Conversations</div>
                <div className="text-3xl font-bold text-ui-text">--</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-sm mb-1">System Status</div>
                <div className="text-3xl font-bold text-green-500 flex items-center gap-2">Online <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span></div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-deepTech-DEFAULT mb-6">Your Expert Workspaces</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {intakeForms.map(form => {
                const dept = (form.department as Department) || 'Sales';
                const Icon = DEPT_ICONS[dept] || Briefcase;
                const isActive = clientData.business_name === form.companyName && clientData.selected_departments.includes(dept);

                return (
                  <div key={form.id} className={`bg-white p-6 rounded-2xl border transition-all group hover:-translate-y-1 ${isActive ? 'border-neural-DEFAULT ring-1 ring-neural-DEFAULT shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-gradient-brand text-white' : 'bg-cyan-bio/10 text-neural-DEFAULT group-hover:bg-gradient-brand group-hover:text-white'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {isActive && <span className="bg-cyan-50 text-neural-dark text-xs px-2 py-1 rounded-full font-medium border border-cyan-100">Active Session</span>}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium border ml-auto ${isActive ? 'hidden' : ''} ${form.status === 'submitted' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                        {form.status === 'submitted' ? 'Ready' : form.status}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-ui-text mb-0.5">{dept} Expert</h4>
                    <p className="text-sm font-semibold text-gray-500 mb-2">{form.companyName}</p>

                    <p className="text-ui-slate text-sm mb-6 line-clamp-2 h-10">
                      {form.mainGoals?.[0] || 'AI Assistant ready to help.'}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => handleSwitchAndNav(form, dept, 'chat')} className="bg-gray-50 text-ui-text font-semibold py-2 rounded-lg hover:bg-neural-DEFAULT hover:text-black transition-all flex items-center justify-center gap-2 text-sm border border-gray-100 hover:border-transparent">
                        <Zap className="w-4 h-4" /> Agent
                      </button>
                      {/* <button onClick={() => handleSwitchAndNav(form, dept, 'hub')} className="bg-gray-50 text-ui-text font-semibold py-2 rounded-lg hover:bg-midnight-DEFAULT hover:text-white transition-all flex items-center justify-center gap-2 text-sm border border-gray-100 hover:border-transparent">
                        <Users className="w-4 h-4" /> Hub
                      </button> */}
                    </div>
                  </div>
                );
              })}

              {/* Add New Card */}
              <button onClick={() => navigate('/add-expert')} className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 gap-4 hover:border-neural-DEFAULT/50 hover:bg-neural-DEFAULT/5 transition-all group min-h-[250px]">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-gray-400 group-hover:text-neural-DEFAULT" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-gray-500 group-hover:text-neural-DEFAULT">Add New Expert</h4>
                  <p className="text-xs text-gray-400 mt-1">Configure another AI department</p>
                </div>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
