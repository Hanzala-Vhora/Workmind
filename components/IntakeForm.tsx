
import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { Department } from '../types';
import { ArrowRight, Check, Loader, Building2, Globe, Rocket, Target, Zap, TrendingUp, DollarSign, HelpCircle, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { clsx } from 'clsx';

const DEPARTMENTS: Department[] = ['Sales', 'Marketing', 'Finance', 'Operations', 'HR', 'IT', 'Social Media', 'Procurement'];

const INDUSTRIES = ['SaaS', 'E-commerce', 'Healthcare', 'Education', 'Finance', 'Marketing', 'Other'];
const BUSINESS_STAGES = ['Idea', 'Starting', 'Growing', 'Established'];
const REVENUE_MODELS = ['Service-based', 'Product sales', 'Subscription', 'Freemium', 'Other'];

export const IntakeForm: React.FC = () => {
  const { setClientData } = useApp();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    business_name: '',
    business_description: '',
    industries: [] as string[],
    target_customer: '',
    differentiator: '',
    stage: '',
    revenue_model: '',
    help_needed: [] as Department[],
    goal: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors: Record<string, string> = {};
    if (!formData.business_name) newErrors.business_name = 'Required';
    if (!formData.stage) newErrors.stage = 'Required';
    if (formData.industries.length === 0) newErrors.industries = 'Select at least one';
    if (formData.help_needed.length === 0) newErrors.help_needed = 'Select at least one';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
        department: formData.help_needed[0] || 'General'
      };

      await apiClient.intakeForms.create(intakeFormData);
      
      // Store locally
      setClientData({
        business_name: formData.business_name,
        industry: formData.industries[0],
        stage: formData.stage,
        selected_departments: formData.help_needed,
        // ... map other fields as needed for the context
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
    <div className="min-h-screen bg-[#F8FAFC] py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="text-4xl font-bold text-brand-navy mb-4">Tell us about your business</h1>
          <p className="text-ui-slate text-lg">Help us customize your AI Workmind OS experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12 bg-white p-10 rounded-3xl shadow-xl shadow-brand-navy/5 border border-ui-border">
          
          {/* 1. Business Name */}
          <FloatingInput 
            label="Business Name"
            placeholder="e.g., Google.com"
            value={formData.business_name}
            onChange={v => update('business_name', v)}
            icon={<Building2 className="w-5 h-5" />}
            error={errors.business_name}
          />

          {/* 2. What does your business do? */}
          <FloatingTextArea 
            label="What does your business do?"
            placeholder="e.g., We help restaurants get more online orders"
            value={formData.business_description}
            onChange={v => update('business_description', v)}
            icon={<Globe className="w-5 h-5" />}
          />

          {/* 3. Industry (Multi Select) */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-brand-navy uppercase tracking-wider">
              <Rocket className="w-4 h-4 text-cyan-bio" />
              Industry
            </label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(industry => (
                <button
                  key={industry}
                  type="button"
                  onClick={() => toggleMulti('industries', industry)}
                  className={clsx(
                    "px-4 py-2 rounded-full border-2 transition-all duration-200 text-sm font-medium",
                    formData.industries.includes(industry)
                      ? "bg-cyan-bio border-cyan-bio text-white shadow-md shadow-cyan-bio/20"
                      : "bg-white border-ui-border text-ui-slate hover:border-cyan-bio/50 hover:text-cyan-bio"
                  )}
                >
                  {industry}
                </button>
              ))}
            </div>
            {errors.industries && <p className="text-xs text-red-500 mt-1">{errors.industries}</p>}
          </div>

          {/* 4. Target Customer */}
          <FloatingInput 
            label="Target Customer"
            placeholder="e.g., Small business owners"
            value={formData.target_customer}
            onChange={v => update('target_customer', v)}
            icon={<Target className="w-5 h-5" />}
          />

          {/* 5. What makes you different? */}
          <FloatingInput 
            label="What makes you different?"
            placeholder="e.g., Faster delivery + AI automation"
            value={formData.differentiator}
            onChange={v => update('differentiator', v)}
            icon={<Zap className="w-5 h-5" />}
          />

          {/* 6. Business Stage (Select Dropdown) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-brand-navy uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-neural" />
                Business Stage
              </label>
              <select 
                value={formData.stage}
                onChange={e => update('stage', e.target.value)}
                className="w-full bg-white border-2 border-ui-border rounded-xl px-4 py-3 outline-none focus:border-neural transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled>Select Stage</option>
                {BUSINESS_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.stage && <p className="text-xs text-red-500 mt-1">{errors.stage}</p>}
            </div>

            {/* 7. Revenue Model (Select Dropdown) */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-brand-navy uppercase tracking-wider">
                <DollarSign className="w-4 h-4 text-green-500" />
                Revenue Model
              </label>
              <select 
                value={formData.revenue_model}
                onChange={e => update('revenue_model', e.target.value)}
                className="w-full bg-white border-2 border-ui-border rounded-xl px-4 py-3 outline-none focus:border-green-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled>Select Model</option>
                {REVENUE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* 8. Help Needed (Multi Select) */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-brand-navy uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-purple-500" />
              What do you need help with?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => toggleMulti('help_needed', dept)}
                  className={clsx(
                    "flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-semibold text-left",
                    formData.help_needed.includes(dept)
                      ? "bg-purple-50 border-purple-500 text-purple-700 shadow-sm"
                      : "bg-white border-ui-border text-ui-slate hover:border-purple-300 hover:bg-purple-50/30"
                  )}
                >
                  {dept}
                  {formData.help_needed.includes(dept) && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
            {errors.help_needed && <p className="text-xs text-red-500 mt-1">{errors.help_needed}</p>}
          </div>

          {/* 9. Your Current Goal */}
          <FloatingTextArea 
            label="Your Current Goal"
            placeholder="e.g., Get more leads in 3 months"
            value={formData.goal}
            onChange={v => update('goal', v)}
            icon={<Flag className="w-5 h-5" />}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-brand-navy text-white rounded-2xl font-bold text-lg hover:bg-brand-navy/90 transition-all shadow-xl shadow-brand-navy/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Setting up your OS...
              </>
            ) : (
              <>
                Get Started
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// UI Components with Animations
const FloatingInput = ({ label, value, onChange, placeholder, icon, error }: any) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div className="relative group">
      <div className={clsx(
        "flex items-center gap-4 border-2 rounded-2xl px-5 py-4 transition-all duration-300",
        error ? "border-red-500 bg-red-50/50" : focused ? "border-cyan-bio ring-4 ring-cyan-bio/10 bg-white" : "border-ui-border group-hover:border-ui-slate/30 bg-white"
      )}>
        <div className={clsx("transition-colors duration-300 shrink-0", focused ? "text-cyan-bio" : "text-ui-slate")}>
          {icon}
        </div>
        <div className="relative flex-1">
          <label className={clsx(
            "absolute left-0 transition-all duration-300 pointer-events-none select-none px-1",
            active ? "-top-7 -left-1 text-xs font-bold text-cyan-bio" : "top-0 text-ui-slate text-base"
          )}>
            {label}
          </label>
          <input
            type="text"
            className="w-full bg-transparent outline-none text-brand-navy font-semibold text-lg placeholder-transparent focus:placeholder-ui-slate/30"
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1 ml-2 font-medium">{error}</p>}
    </div>
  );
};

const FloatingTextArea = ({ label, value, onChange, placeholder, icon }: any) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div className="relative group">
      <div className={clsx(
        "flex items-start gap-4 border-2 rounded-2xl px-5 py-4 transition-all duration-300",
        focused ? "border-cyan-bio ring-4 ring-cyan-bio/10 bg-white" : "border-ui-border group-hover:border-ui-slate/30 bg-white"
      )}>
        <div className={clsx("mt-1 transition-colors duration-300 shrink-0", focused ? "text-cyan-bio" : "text-ui-slate")}>
          {icon}
        </div>
        <div className="relative flex-1">
          <label className={clsx(
            "absolute left-0 transition-all duration-300 pointer-events-none select-none px-1",
            active ? "-top-7 -left-1 text-xs font-bold text-cyan-bio" : "top-1 text-ui-slate text-base"
          )}>
            {label}
          </label>
          <textarea
            className="w-full bg-transparent outline-none text-brand-navy font-semibold text-lg placeholder-transparent focus:placeholder-ui-slate/30 h-32 resize-none pt-1"
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
