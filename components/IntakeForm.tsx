import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { Department, IntakeData } from '../types';
import { Loader2, Globe, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
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

// --- Reusable UI Components (Shadcn-like minimal design) ---
const Label = ({ children, required, htmlFor }: any) => (
  <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 mb-2 block">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = ({ error, icon, className, ...props }: any) => (
  <div className="relative">
    {icon && <div className="absolute left-3 top-2.5 text-slate-400">{icon}</div>}
    <input 
      className={clsx(
        "flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        icon ? "pl-10" : "",
        error ? "border-red-500 focus:ring-red-500" : "border-slate-200",
        className
      )}
      {...props}
    />
  </div>
);

const Textarea = ({ error, className, ...props }: any) => (
  <textarea 
    className={clsx(
      "flex min-h-[100px] w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y",
      error ? "border-red-500 focus:ring-red-500" : "border-slate-200",
      className
    )}
    {...props}
  />
);

const Select = ({ error, options, className, ...props }: any) => (
  <select
    className={clsx(
      "flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors appearance-none",
      error ? "border-red-500 focus:ring-red-500" : "border-slate-200",
      className
    )}
    {...props}
  >
    <option value="" disabled>Select an option</option>
    {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
  </select>
);

// --- Form Error Component ---
const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;
  return <p className="text-xs font-medium text-red-500 mt-1.5">{message}</p>;
};

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
    if (formData.industries.length === 0) newErrors.industries = 'Select at least one industry';

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
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center items-center">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Simple Header */}
        <div className="border-b border-slate-100 p-8 text-center bg-slate-50/50">
          <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isAddMode ? 'Expand Workspace' : 'Create Workspace'}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Configure your AI agents with your company's core context.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Company Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Company Details</h3>
              <p className="text-sm text-slate-500 mb-4">Basic information about your business.</p>
            </div>

            <div className="grid gap-4">
              <div>
                <Label required>Business Name</Label>
                <Input 
                  placeholder="e.g. Acme Corp" 
                  value={formData.business_name}
                  onChange={(e: any) => update('business_name', e.target.value)}
                  error={!!errors.business_name}
                />
                <ErrorMessage message={errors.business_name} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label required>Industry</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {INDUSTRIES.map(ind => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => toggleMulti('industries', ind)}
                        className={clsx(
                          "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                          formData.industries.includes(ind)
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                  <ErrorMessage message={errors.industries} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label required>Business Stage</Label>
                  <Select 
                    value={formData.stage}
                    onChange={(e: any) => update('stage', e.target.value)}
                    options={BUSINESS_STAGES}
                    error={!!errors.stage}
                  />
                  <ErrorMessage message={errors.stage} />
                </div>
                <div>
                  <Label>Revenue Model</Label>
                  <Select 
                    value={formData.revenue_model}
                    onChange={(e: any) => update('revenue_model', e.target.value)}
                    options={REVENUE_MODELS}
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* AI Automated Context */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Website Context (Auto-Fill)</h3>
              <p className="text-sm text-slate-500 mb-4">Provide your website and we'll automatically generate your business profile.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <Label>Website URL</Label>
                <Input 
                  placeholder="https://example.com" 
                  value={formData.website_url}
                  onChange={(e: any) => update('website_url', e.target.value)}
                  icon={<Globe className="w-4 h-4" />}
                />
              </div>
              <div className="flex-1 w-full">
                <Label>Social Links (Optional)</Label>
                <Input 
                  placeholder="linkedin.com/company/..." 
                  value={formData.social_links}
                  onChange={(e: any) => update('social_links', e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !formData.website_url}
                className="w-full md:w-auto h-10 px-4 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Analyze
              </button>
            </div>

            {formData.shared_context && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900">Context Extracted</h4>
                  <p className="text-xs text-green-700 mt-1">Website analyzed successfully. This global context will be shared automatically across all your AI agents.</p>
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Manual Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Additional Context</h3>
              <p className="text-sm text-slate-500 mb-4">You can manually define specific goals or descriptions.</p>
            </div>

            <div className="grid gap-4">
              <div>
                <Label>Business Description & Mission</Label>
                <Textarea 
                  placeholder="What do you do?"
                  value={formData.business_description}
                  onChange={(e: any) => update('business_description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Target Customer</Label>
                  <Input 
                    placeholder="Who do you sell to?"
                    value={formData.target_customer}
                    onChange={(e: any) => update('target_customer', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Unique Differentiator</Label>
                  <Input 
                    placeholder="What makes you special?"
                    value={formData.differentiator}
                    onChange={(e: any) => update('differentiator', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Primary 90-Day Goal</Label>
                <Input 
                  placeholder="e.g., Automate client onboarding"
                  value={formData.goal}
                  onChange={(e: any) => update('goal', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating Workspace...' : 'Create AI Workspace'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
