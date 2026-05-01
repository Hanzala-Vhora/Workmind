
import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { Department, IntakeData } from '../types';
import { ArrowRight, Check, Loader, Building2, Globe, Rocket, Target, Zap, TrendingUp, DollarSign, HelpCircle, Flag, Briefcase, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { clsx } from 'clsx';

const DEPARTMENTS: Department[] = ['Sales', 'Marketing', 'Finance', 'Operations', 'HR', 'IT', 'Social Media', 'Procurement'];

export const INITIAL_DATA: IntakeData = {
  business_name: '', website: '', industry: '', sub_sector: '', business_model: 'B2B', stage: 'Growth', countries_served: [], hq_location: '', founders_roles: '', primary_contact: '',
  main_offer: '', icp: '', buyer_roles: '', main_pain: '', promise: '', competitors: [], key_objections: '', usp: '',
  revenue_streams: '', pricing_model: 'One-time', price_points: '', sales_cycle: '1-3 months', revenue_target_90d: '', revenue_target_12m: '',
  lead_sources: [], working_channels: '', failing_channels: '', sales_mechanism: '', crm_tool: '', close_rate: '',
  delivery_process: '', tool_stack: [], broken_workflows: '', time_wasters: '', has_sops: 'No', team_structure: '', decision_approver: '',
  is_regulated: 'No', sensitive_data: 'None',
  selected_departments: DEPARTMENTS, department_configs: {},
  brand_tone: 'Professional', brand_keywords: '', writing_samples: '', interaction_style: 'Collaborative',
  deliverables: [], output_format: 'Markdown', client_facing_needed: 'No', deadline: '',
  reference_brands: '', hard_constraints: '', must_avoid: ''
};

const INDUSTRIES = ['SaaS', 'E-commerce', 'Healthcare', 'Education', 'Finance', 'Marketing', 'Other'];
const BUSINESS_STAGES = ['Idea', 'Starting', 'Growing', 'Established'];
const REVENUE_MODELS = ['Service-based', 'Product sales', 'Subscription', 'Freemium', 'Other'];

interface IntakeFormProps {
  mode?: 'initial' | 'add';
}

export const IntakeForm: React.FC<IntakeFormProps> = ({ mode = 'initial' }) => {
  const { setClientData, clientData } = useApp();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const isAddMode = mode === 'add';

  const [formData, setFormData] = useState({
    business_name: isAddMode ? (clientData?.business_name || '') : '',
    business_description: isAddMode ? (clientData?.main_offer || '') : '',
    industries: isAddMode ? [clientData?.industry || ''].filter(Boolean) : [] as string[],
    target_customer: isAddMode ? (clientData?.icp || '') : '',
    differentiator: isAddMode ? (clientData?.usp || '') : '',
    stage: isAddMode ? (clientData?.stage || '') : '',
    revenue_model: isAddMode ? (clientData?.pricing_model || '') : '',
    help_needed: DEPARTMENTS,
    goal: '',
    website_url: '',
    social_links: '',
    shared_context: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleMulti = (field: 'industries' | 'help_needed', value: any) => {
    const current = formData[field] as any[];
    if (current.includes(value)) {
      update(field, current.filter(v => v !== value));
    } else {
      update(field, [...current, value]);
    }
  };

  const handleAnalyze = async () => {
    if (!formData.website_url) {
      alert('Please enter a website URL to analyze.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await apiClient.intakeForms.analyze(formData.website_url, formData.social_links);
      update('shared_context', res.sharedContext);
      alert('Website analyzed successfully! The context has been injected and will be shared across all AI agents.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to analyze website: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.business_name) newErrors.business_name = 'Required';
    if (!formData.stage) newErrors.stage = 'Required';
    if (formData.industries.length === 0) newErrors.industries = 'Select at least one';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!user) return;

      const intakeFormData = {
        workspaceId: 'ws-' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress,
        userName: user.fullName || user.firstName,
        companyName: formData.business_name,
        industry: formData.industries.join(', '),
        companySize: formData.stage,
        currentState: formData.business_description,
        mainGoals: [formData.goal],
        challenges: [formData.differentiator],
        resources: formData.target_customer,
        timeline: 'Immediate',
        budget: formData.revenue_model,
        department: formData.help_needed.join(', ') || 'All Departments',
        sharedContext: formData.shared_context
      };

      await apiClient.intakeForms.create(intakeFormData);

      setClientData({
        business_name: formData.business_name,
        industry: formData.industries[0],
        stage: formData.stage,
        selected_departments: formData.help_needed,
      } as any);

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert('Failed to submit: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 py-16 px-4 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            AI Workspace Configuration
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            {isAddMode ? 'Expand your AI Team' : 'Build your Digital Twin'}
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">
            {isAddMode
              ? 'Configure specialized AI experts to handle specific departments in your business.'
              : 'Tell us about your business to help your AI agents understand your unique voice and goals.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

          {/* Section 1: Core Identity */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 space-y-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Core Identity</h2>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Business Basics</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
              {/* 1. Business Name */}
              <FloatingInput
                label="Business Name"
                placeholder="e.g., Apple Inc."
                value={formData.business_name}
                onChange={v => update('business_name', v)}
                icon={<Building2 className="w-5 h-5" />}
                error={errors.business_name}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FloatingInput
                  label="Website URL"
                  placeholder="e.g., https://apple.com"
                  value={formData.website_url}
                  onChange={v => update('website_url', v)}
                  icon={<Globe className="w-5 h-5" />}
                />
                <FloatingInput
                  label="Social Media Links"
                  placeholder="e.g., linkedin.com/company/apple"
                  value={formData.social_links}
                  onChange={v => update('social_links', v)}
                  icon={<Zap className="w-5 h-5" />}
                />
              </div>

              {formData.website_url && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full md:w-auto px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  {isAnalyzing ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Analyzing & Extracting Context...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Analyze Website Context</>
                  )}
                </button>
              )}

              {formData.shared_context && (
                 <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                       <Check className="w-5 h-5 text-indigo-600" />
                       <h3 className="font-bold text-indigo-900">Website Analyzed</h3>
                    </div>
                    <p className="text-sm text-indigo-700">The business context has been successfully extracted and will be shared with all AI experts.</p>
                 </div>
              )}

              {/* 2. What does your business do? */}
              <FloatingTextArea
                label="Business Mission & Description"
                placeholder="e.g., We build high-end consumer electronics that empower people to create..."
                value={formData.business_description}
                onChange={v => update('business_description', v)}
                icon={<Globe className="w-5 h-5" />}
              />
            </div>
          </div>

          {/* Section 2: Market Context */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 space-y-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-100">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Market Context</h2>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Positioning & Strategy</p>
              </div>
            </div>

            <div className="space-y-10">
              {/* 3. Industry (Multi Select) */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Primary Industries
                </label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map(industry => (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => toggleMulti('industries', industry)}
                      className={clsx(
                        "px-6 py-2.5 rounded-2xl border-2 transition-all duration-300 text-sm font-bold",
                        formData.industries.includes(industry)
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200 scale-105"
                          : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
                {errors.industries && <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.industries}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FloatingInput
                  label="Target Customer"
                  placeholder="e.g., Mid-market CEOs"
                  value={formData.target_customer}
                  onChange={v => update('target_customer', v)}
                  icon={<Target className="w-5 h-5" />}
                />
                <FloatingInput
                  label="Your Unique Differentiator"
                  placeholder="e.g., 24/7 Human-in-the-loop AI"
                  value={formData.differentiator}
                  onChange={v => update('differentiator', v)}
                  icon={<Zap className="w-5 h-5" />}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Operations */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 space-y-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-100">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Operations</h2>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Growth & Revenue</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Business Stage
                </label>
                <div className="relative">
                  <select
                    value={formData.stage}
                    onChange={e => update('stage', e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-amber-500 transition-all appearance-none cursor-pointer font-bold text-slate-700"
                  >
                    <option value="" disabled>Select Stage</option>
                    {BUSINESS_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                {errors.stage && <p className="text-xs text-red-500 mt-2 font-bold">{errors.stage}</p>}
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Revenue Model
                </label>
                <div className="relative">
                  <select
                    value={formData.revenue_model}
                    onChange={e => update('revenue_model', e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-amber-500 transition-all appearance-none cursor-pointer font-bold text-slate-700"
                  >
                    <option value="" disabled>Select Model</option>
                    {REVENUE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: AI Deployment */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 space-y-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI Deployment</h2>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Expert Configuration</p>
              </div>
            </div>

            <div className="space-y-10">
              <FloatingTextArea
                label="Your Immediate 90-Day Goal"
                placeholder="e.g., Automate client onboarding and reach $50k MRR..."
                value={formData.goal}
                onChange={v => update('goal', v)}
                icon={<Flag className="w-5 h-5" />}
              />
            </div>
          </div>

          {/* Submit Button Area */}
          <div className="pt-8 text-center space-y-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full max-w-md mx-auto py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isSubmitting ? (
                <>
                  <Loader className="w-6 h-6 animate-spin text-indigo-400" />
                  <span>Calibrating Neural Engine...</span>
                </>
              ) : (
                <>
                  <span>Initialize Workmind OS</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Secured with Clerk Enterprise Encryption
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

// Re-engineered Shadcn-style components
const FloatingInput = ({ label, value, onChange, placeholder, icon, error }: any) => {
  const [focused, setFocused] = useState(false);
  const active = focused || (value && value.length > 0);

  return (
    <div className="relative w-full">
      <div className={clsx(
        "relative flex items-center gap-4 border-2 rounded-2xl px-6 py-5 transition-all duration-300",
        error ? "border-red-500 bg-red-50/50" : focused ? "border-indigo-500 ring-4 ring-indigo-500/5 bg-white shadow-lg shadow-indigo-100/20" : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200"
      )}>
        <div className={clsx("transition-colors duration-300 shrink-0", focused ? "text-indigo-500" : "text-slate-400")}>
          {icon}
        </div>
        <div className="relative flex-1">
          <label className={clsx(
            "absolute left-0 transition-all duration-300 pointer-events-none select-none px-1 z-10",
            active
              ? "-top-[2.2rem] -left-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-100"
              : "top-0 text-slate-400 text-lg font-medium opacity-100"
          )}>
            {label}
          </label>
          <input
            type="text"
            className="w-full bg-transparent outline-none text-slate-900 font-bold text-lg placeholder-transparent focus:placeholder-slate-300"
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-[10px] text-red-500 mt-2 ml-4 font-black uppercase tracking-wider">{error}</p>}
    </div>
  );
};

const FloatingTextArea = ({ label, value, onChange, placeholder, icon }: any) => {
  const [focused, setFocused] = useState(false);
  const active = focused || (value && value.length > 0);

  return (
    <div className="relative w-full">
      <div className={clsx(
        "relative flex items-start gap-4 border-2 rounded-[2rem] px-6 py-5 transition-all duration-300",
        focused ? "border-indigo-500 ring-4 ring-indigo-500/5 bg-white shadow-lg shadow-indigo-100/20" : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200"
      )}>
        <div className={clsx("mt-1 transition-colors duration-300 shrink-0", focused ? "text-indigo-500" : "text-slate-400")}>
          {icon}
        </div>
        <div className="relative flex-1">
          <label className={clsx(
            "absolute left-0 transition-all duration-300 pointer-events-none select-none px-1 z-10",
            active
              ? "-top-[2.2rem] -left-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-100"
              : "top-0 text-slate-400 text-lg font-medium opacity-100"
          )}>
            {label}
          </label>
          <textarea
            className="w-full bg-transparent outline-none text-slate-900 font-bold text-lg placeholder-transparent focus:placeholder-slate-300 h-32 resize-none pt-0.5 leading-relaxed"
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);
