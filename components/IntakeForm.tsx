
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { IntakeData, Department } from '../types';
import { ArrowLeft, ArrowRight, Check, Upload, Home, AlertCircle, Plus, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';

const DEPARTMENTS: Department[] = ['Sales', 'Marketing', 'Finance', 'Operations', 'HR', 'IT', 'Social Media', 'Procurement'];

export const INITIAL_DATA: IntakeData = {
  // A
  business_name: '', website: '', industry: '', sub_sector: '', business_model: 'B2B', stage: 'Growth', countries_served: [], hq_location: '', founders_roles: '', primary_contact: '',
  // B
  main_offer: '', icp: '', buyer_roles: '', main_pain: '', promise: '', competitors: [], key_objections: '', usp: '',
  // C
  revenue_streams: '', pricing_model: 'One-time', price_points: '', sales_cycle: '1-3 months', revenue_target_90d: '', revenue_target_12m: '',
  // D
  lead_sources: [], working_channels: '', failing_channels: '', sales_mechanism: '', crm_tool: '', close_rate: '',
  // E
  delivery_process: '', tool_stack: [], broken_workflows: '', time_wasters: '', has_sops: 'No', team_structure: '', decision_approver: '',
  // F
  is_regulated: 'No', sensitive_data: 'None',
  // G
  selected_departments: [], department_configs: {},
  // H
  brand_tone: 'Professional', brand_keywords: '', writing_samples: '', interaction_style: 'Collaborative',
  // I
  deliverables: [], output_format: 'Markdown', client_facing_needed: 'No', deadline: '',
  // J
  reference_brands: '', hard_constraints: '', must_avoid: ''
};

interface IntakeFormProps {
  mode?: 'initial' | 'add';
}

export const IntakeForm: React.FC<IntakeFormProps> = ({ mode = 'initial' }) => {
  const { setClientData, clientData } = useApp();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const isAddMode = mode === 'add';

  useEffect(() => {
    if (isLoaded && user && mode === 'initial') {
      const checkStatus = async () => {
        try {
          const status = await apiClient.users.checkOnboardingStatus(user.id);
          if (status.completed) {
            navigate('/dashboard');
          }
        } catch (err) {
          console.error("Failed to check status", err);
        }
      };
      checkStatus();
    }
  }, [isLoaded, user, mode, navigate]);

  const [step, setStep] = useState(isAddMode ? 4 : 1);
  const [formData, setFormData] = useState<IntakeData>(() => {
    if (clientData) return { ...INITIAL_DATA, ...clientData };
    return INITIAL_DATA;
  });

  const [miniIntakeIndex, setMiniIntakeIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDepartments, setNewDepartments] = useState<Department[]>([]);

  // Update helper
  const update = (field: keyof IntakeData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleDeptToggle = (dept: Department) => {
    const current = formData.selected_departments;
    let newDepts;
    if (current.includes(dept)) {
      if (isAddMode && clientData?.selected_departments.includes(dept)) {
        // Cannot remove existing depts in add mode
        return;
      }
      newDepts = current.filter(d => d !== dept);
      setNewDepartments(prev => prev.filter(d => d !== dept));
    } else {
      newDepts = [...current, dept];
      if (isAddMode) setNewDepartments(prev => [...prev, dept]);
    }
    update('selected_departments', newDepts);
  };

  const handleMiniIntakeUpdate = (dept: Department, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      department_configs: {
        ...prev.department_configs,
        [dept]: {
          ...prev.department_configs[dept],
          department: dept,
          [field]: value
        }
      }
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.business_name.trim()) newErrors.business_name = 'Required';
      if (!formData.industry.trim()) newErrors.industry = 'Required';
    }
    if (currentStep === 4) {
      if (formData.selected_departments.length === 0) newErrors.selected_departments = 'Select at least one department';
      if (isAddMode && newDepartments.length === 0) newErrors.selected_departments = 'Select a new department to add';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return isValid;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;

    if (step === 4) {
      // Determine which departments need mini-intake
      // In Add Mode: only newDepartments
      // In Full Mode: all selected_departments
      const deptsToConfigure = isAddMode ? newDepartments : formData.selected_departments;

      if (deptsToConfigure.length > 0) {
        setStep(5);
        setMiniIntakeIndex(0);
      } else {
        // Should not happen due to validation, but safeguard
        if (isAddMode) {
          handleSubmit();
        } else {
          setStep(6);
        }
      }
    } else if (step === 5) {
      const deptsToConfigure = isAddMode ? newDepartments : formData.selected_departments;
      if (miniIntakeIndex < deptsToConfigure.length - 1) {
        setMiniIntakeIndex(prev => prev + 1);
      } else {
        if (isAddMode) {
          handleSubmit(); // Finish immediately for add mode
        } else {
          setStep(6);
        }
      }
    } else {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setErrors({});
    if (step === 5) {
      if (miniIntakeIndex > 0) {
        setMiniIntakeIndex(prev => prev - 1);
      } else {
        setStep(4);
      }
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!user) return;

      // Call backend API to create intake form
      const intakeFormData = {
        workspaceId: 'workspace-' + Date.now(), // Generate a unique workspace ID
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress,
        userName: user.fullName || user.firstName,
        companyName: formData.business_name,
        contactEmail: formData.primary_contact,
        contactPhone: '',
        department: formData.selected_departments[0] || 'General',
        industry: formData.industry,
        companySize: formData.stage,
        currentState: formData.main_offer,
        mainGoals: formData.revenue_streams ? [formData.revenue_streams] : [],
        challenges: formData.broken_workflows ? [formData.broken_workflows] : [],
        resources: formData.team_structure,
        timeline: formData.sales_cycle || '1-3 months',
        budget: formData.revenue_target_12m,
      };

      const result = await apiClient.intakeForms.create(intakeFormData);

      // Save to local state as well
      setClientData(formData);

      // Show success message
      alert('✅ Intake form submitted successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setErrors({ submit: error.message || 'Failed to submit form' });
      alert('❌ Error submitting form: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which department is currently being configured in Step 5
  const currentMiniDept = isAddMode
    ? newDepartments[miniIntakeIndex]
    : formData.selected_departments[miniIntakeIndex];

  return (
    <div className="min-h-screen bg-ui-card flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-brand px-8 py-6 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold font-sans">{isAddMode ? 'Add New Expert' : 'Workmind AI Configuration'}</h2>
            <p className="text-cyan-bio text-sm opacity-90">
              {step === 1 ? '1. Identity & Strategy' :
                step === 2 ? '2. Economics & Sales' :
                  step === 3 ? '3. Ops & Compliance' :
                    step === 4 ? '4. Agent Selection' :
                      step === 5 ? `5. Training: ${currentMiniDept}` : '6. Final Polish'}
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
            <Home className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto flex-1">

          {Object.keys(errors).length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-800 font-bold text-sm">Please fix the following errors:</h4>
                <ul className="list-disc list-inside text-xs text-red-700 mt-1">
                  {Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* STEP 1: IDENTITY (Sections A, B) */}
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              <section>
                <h3 className="text-lg font-bold text-deepTech-DEFAULT mb-4 border-b pb-2">A. Business Snapshot</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="Business Name" value={formData.business_name} onChange={v => update('business_name', v)} required error={errors.business_name} />
                  <Input label="Website" value={formData.website} onChange={v => update('website', v)} />
                  <Input label="Primary Industry" value={formData.industry} onChange={v => update('industry', v)} required error={errors.industry} />
                  <Input label="Sub-sector / Niche" value={formData.sub_sector} onChange={v => update('sub_sector', v)} />
                  <Select label="Business Model" value={formData.business_model} onChange={v => update('business_model', v)} options={['B2B', 'B2C', 'Marketplace', 'SaaS', 'Service']} />
                  <Select label="Stage" value={formData.stage} onChange={v => update('stage', v)} options={['Idea', 'Startup', 'Growth', 'Scale', 'Enterprise']} />
                  <Input label="Countries Served" value={formData.countries_served.join(', ')} onChange={v => update('countries_served', v.split(','))} placeholder="USA, UK, etc." />
                  <Input label="HQ Location" value={formData.hq_location} onChange={v => update('hq_location', v)} />
                  <TextArea label="Founder(s) & Roles" value={formData.founders_roles} onChange={v => update('founders_roles', v)} className="md:col-span-2" />
                  <Input label="Primary Point of Contact + Role" value={formData.primary_contact} onChange={v => update('primary_contact', v)} className="md:col-span-2" />
                </div>
                {/* Conditional Logic: Startup */}
                {(formData.stage === 'Idea' || formData.stage === 'Startup') && (
                  <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-100 grid md:grid-cols-2 gap-4">
                    <Input label="What are you selling first?" value={formData.startup_selling_first || ''} onChange={v => update('startup_selling_first', v)} />
                    <Input label="First 10 customers plan" value={formData.startup_first_10_plan || ''} onChange={v => update('startup_first_10_plan', v)} />
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-lg font-bold text-deepTech-DEFAULT mb-4 border-b pb-2">B. Offer, Customer & Promise</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <TextArea label="Main Offer(s) Today" value={formData.main_offer} onChange={v => update('main_offer', v)} />
                  <TextArea label="Who buys (ICP)" value={formData.icp} onChange={v => update('icp', v)} />
                  <TextArea label="Buyer Roles / Decision Makers" value={formData.buyer_roles} onChange={v => update('buyer_roles', v)} />
                  <TextArea label="Main Pain You Solve" value={formData.main_pain} onChange={v => update('main_pain', v)} />
                  <Input label="Your Promise (One Sentence)" value={formData.promise} onChange={v => update('promise', v)} className="md:col-span-2" />
                  <Input label="Top 3 Competitors" value={formData.competitors.join(', ')} onChange={v => update('competitors', v.split(','))} className="md:col-span-2" />
                  <TextArea label="Key Objections" value={formData.key_objections} onChange={v => update('key_objections', v)} />
                  <TextArea label="Primary Differentiators (USP)" value={formData.usp} onChange={v => update('usp', v)} />
                </div>
                {formData.business_model === 'B2B' && (
                  <div className="bg-purple-50 p-4 rounded-lg mt-4 border border-purple-100 grid md:grid-cols-2 gap-4">
                    <Input label="Target Account Types" value={formData.b2b_account_types || ''} onChange={v => update('b2b_account_types', v)} />
                    <Input label="Buying Committee" value={formData.b2b_buying_committee || ''} onChange={v => update('b2b_buying_committee', v)} />
                    <Input label="Procurement Steps" value={formData.b2b_procurement_steps || ''} onChange={v => update('b2b_procurement_steps', v)} className="md:col-span-2" />
                  </div>
                )}
              </section>
            </div>
          )}

          {/* STEP 2: ECONOMICS & SALES (Sections C, D) */}
          {step === 2 && (
            <div className="space-y-8 animate-fadeIn">
              <section>
                <h3 className="text-lg font-bold text-deepTech-DEFAULT mb-4 border-b pb-2">C. Revenue & Economics</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <TextArea label="Revenue Streams" value={formData.revenue_streams} onChange={v => update('revenue_streams', v)} />
                  <Select label="Pricing Model" value={formData.pricing_model} onChange={v => update('pricing_model', v)} options={['Subscription', 'One-time', 'Retainer', 'Usage-based']} />
                  <Input label="Price Points" value={formData.price_points} onChange={v => update('price_points', v)} />
                  <Input label="Avg Order/Contract Value" value={formData.avg_order_value || ''} onChange={v => update('avg_order_value', v)} />
                  <Select label="Sales Cycle" value={formData.sales_cycle} onChange={v => update('sales_cycle', v)} options={['Same day', '1-7 days', '2-4 weeks', '1-3 months', '3 months+']} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Target Rev (90d)" value={formData.revenue_target_90d} onChange={v => update('revenue_target_90d', v)} />
                    <Input label="Target Rev (12m)" value={formData.revenue_target_12m} onChange={v => update('revenue_target_12m', v)} />
                  </div>
                </div>
                {formData.business_model === 'SaaS' && (
                  <div className="mt-4 grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <Input label="Activation Metric" value={formData.saas_activation_metric || ''} onChange={v => update('saas_activation_metric', v)} />
                    <Input label="Churn Risks" value={formData.saas_churn_risk || ''} onChange={v => update('saas_churn_risk', v)} />
                    <Input label="Onboarding Flow" value={formData.saas_onboarding || ''} onChange={v => update('saas_onboarding', v)} />
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-lg font-bold text-deepTech-DEFAULT mb-4 border-b pb-2">D. Sales & Lead Gen Reality</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="Current Lead Sources" value={formData.lead_sources.join(', ')} onChange={v => update('lead_sources', v.split(','))} />
                  <TextArea label="What works now?" value={formData.working_channels} onChange={v => update('working_channels', v)} />
                  <TextArea label="What is failing?" value={formData.failing_channels} onChange={v => update('failing_channels', v)} />
                  <Select label="Primary Sales Mechanism" value={formData.sales_mechanism} onChange={v => update('sales_mechanism', v)} options={['DM/Outbound', 'Sales Calls', 'Inbound Form', 'Product-Led', 'Retail', 'Partners']} />
                  <Input label="CRM / Tracking Tool" value={formData.crm_tool} onChange={v => update('crm_tool', v)} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Monthly Leads" value={formData.monthly_leads || ''} onChange={v => update('monthly_leads', v)} />
                    <Input label="Close Rate" value={formData.close_rate} onChange={v => update('close_rate', v)} />
                  </div>
                  <TextArea label="Ideal Activity Targets" value={formData.activity_targets || ''} onChange={v => update('activity_targets', v)} className="md:col-span-2" />
                </div>
              </section>
            </div>
          )}

          {/* STEP 3: OPS & COMPLIANCE (Sections E, F) */}
          {step === 3 && (
            <div className="space-y-8 animate-fadeIn">
              <section>
                <h3 className="text-lg font-bold text-deepTech-DEFAULT mb-4 border-b pb-2">E. Operations & Delivery</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <TextArea label="How you deliver today (Step-by-step)" value={formData.delivery_process} onChange={v => update('delivery_process', v)} className="md:col-span-2" />
                  <Input label="Tools Used" value={formData.tool_stack.join(', ')} onChange={v => update('tool_stack', v.split(','))} />
                  <TextArea label="Key Workflows that Break" value={formData.broken_workflows} onChange={v => update('broken_workflows', v)} />
                  <TextArea label="Top 5 Time Wasters" value={formData.time_wasters} onChange={v => update('time_wasters', v)} />

                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Existing SOPs?</label>
                    <div className="flex gap-4 mb-4">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} onClick={() => update('has_sops', opt)} className={`px-6 py-2 rounded-lg border font-medium ${formData.has_sops === opt ? 'bg-neural-DEFAULT text-white border-neural-DEFAULT' : 'bg-white border-gray-300'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {formData.has_sops === 'Yes' && (
                      <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 bg-white">
                        <Upload className="w-8 h-8 mb-2 text-neural-DEFAULT" />
                        <span className="text-sm font-medium">Upload SOP Files or Paste Links</span>
                      </div>
                    )}
                  </div>

                  <Input label="Team Structure (Size + Roles)" value={formData.team_structure} onChange={v => update('team_structure', v)} />
                  <Input label="Who Approves Decisions?" value={formData.decision_approver} onChange={v => update('decision_approver', v)} />
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-deepTech-DEFAULT mb-4 border-b pb-2">F. Compliance & Risk</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Select label="Regulated Industry?" value={formData.is_regulated} onChange={v => update('is_regulated', v)} options={['Yes', 'No']} />
                  <Select label="Sensitive Data Handled" value={formData.sensitive_data} onChange={v => update('sensitive_data', v)} options={['None', 'Basic Customer Data', 'Financial', 'Medical', 'Minors', 'Other']} />
                </div>
                {formData.is_regulated === 'Yes' && (
                  <TextArea label="Describe Regulatory Constraints" value={formData.regulatory_details || ''} onChange={v => update('regulatory_details', v)} className="mt-4" />
                )}
                <TextArea label="Restricted Policies / Must Follows" value={formData.restricted_policies || ''} onChange={v => update('restricted_policies', v)} className="mt-4" />
              </section>
            </div>
          )}

          {/* STEP 4: AGENT SELECTION (Section G) */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold text-deepTech-DEFAULT mb-4 border-b pb-2">G. Select Department Experts</h3>
              <p className="text-sm text-gray-500">
                {isAddMode ? 'Select the new department you wish to activate.' : 'Choose which departments to generate AI agents for.'}
              </p>

              {errors.selected_departments && <p className="text-red-600 text-sm font-bold bg-red-50 p-2 rounded">{errors.selected_departments}</p>}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DEPARTMENTS.map(dept => {
                  const isSelected = formData.selected_departments.includes(dept);
                  const isExisting = isAddMode && clientData?.selected_departments.includes(dept);

                  return (
                    <div key={dept}
                      onClick={() => handleDeptToggle(dept)}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between
                        ${isExisting ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60' : 'cursor-pointer'}
                        ${isSelected && !isExisting ? 'border-neural-DEFAULT bg-cyan-50 shadow-md' : ''}
                        ${!isSelected && !isExisting ? 'border-gray-100 hover:border-gray-300' : ''}
                      `}>
                      <span className="font-semibold text-gray-800">{dept}</span>
                      {isSelected && <Check className="w-5 h-5 text-neural-DEFAULT" />}
                      {isExisting && <span className="text-[10px] absolute top-2 right-2 bg-gray-200 px-1 rounded text-gray-600">Active</span>}
                    </div>
                  );
                })}
              </div>
              {!isAddMode && (
                <div className="mt-6">
                  <TextArea label="Any departments you do NOT want AI involved in?" value={formData.excluded_departments || ''} onChange={v => update('excluded_departments', v)} />
                </div>
              )}
            </div>
          )}

          {/* STEP 5: MINI INTAKES (Section G continued) */}
          {step === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-neural-DEFAULT/10 p-6 rounded-xl mb-6 border border-neural-DEFAULT/20 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neural-dark">
                    Training: {currentMiniDept} Expert
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Step {miniIntakeIndex + 1} of {isAddMode ? newDepartments.length : formData.selected_departments.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-neural-DEFAULT shadow-sm font-bold text-xl">
                  {currentMiniDept.charAt(0)}
                </div>
              </div>

              <div className="space-y-6 bg-white p-1">
                <Select
                  label="Priority Level"
                  value={formData.department_configs[currentMiniDept]?.priority || 'Medium'}
                  onChange={v => handleMiniIntakeUpdate(currentMiniDept, 'priority', v)}
                  options={['High', 'Medium', 'Low']}
                />
                <TextArea
                  label={`What does "Excellent" look like for ${currentMiniDept} in 90 days?`}
                  value={formData.department_configs[currentMiniDept]?.outcomes_90d || ''}
                  onChange={v => handleMiniIntakeUpdate(currentMiniDept, 'outcomes_90d', v)}
                />
                <TextArea
                  label="Top 5 Tasks this agent must own"
                  value={formData.department_configs[currentMiniDept]?.core_tasks || ''}
                  onChange={v => handleMiniIntakeUpdate(currentMiniDept, 'core_tasks', v)}
                />
                <TextArea
                  label="Top 5 Decisions this department must NOT make without approval"
                  value={formData.department_configs[currentMiniDept]?.approval_boundaries || ''}
                  onChange={v => handleMiniIntakeUpdate(currentMiniDept, 'approval_boundaries', v)}
                  className="border-red-100 bg-red-50/30 rounded-lg p-2"
                />
                <TextArea
                  label="Inputs it receives & Outputs it must produce"
                  value={formData.department_configs[currentMiniDept]?.inputs_outputs || ''}
                  onChange={v => handleMiniIntakeUpdate(currentMiniDept, 'inputs_outputs', v)}
                />
                <TextArea
                  label="Tools and Data Sources it can use"
                  value={formData.department_configs[currentMiniDept]?.data_access || ''}
                  onChange={v => handleMiniIntakeUpdate(currentMiniDept, 'data_access', v)}
                />
              </div>
            </div>
          )}

          {/* STEP 6: FINAL POLISH (Sections H, I, J) */}
          {step === 6 && (
            <div className="space-y-8 animate-fadeIn">
              <section>
                <h3 className="text-lg font-bold text-deepTech-DEFAULT mb-4 border-b pb-2">H. Tone & Brand</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Select label="Tone" value={formData.brand_tone} onChange={v => update('brand_tone', v)} options={['Professional', 'Friendly', 'Direct', 'Witty', 'Academic']} />
                  <Select label="Interaction Style" value={formData.interaction_style} onChange={v => update('interaction_style', v)} options={['Collaborative', 'Directive/Strict']} />
                  <Input label="Brand Keywords" value={formData.brand_keywords} onChange={v => update('brand_keywords', v)} />
                  <TextArea label="Writing Samples" value={formData.writing_samples} onChange={v => update('writing_samples', v)} className="md:col-span-2" />
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-deepTech-DEFAULT mb-4 border-b pb-2">I. Deliverables & Format</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Select label="Preferred Format" value={formData.output_format} onChange={v => update('output_format', v)} options={['Markdown', 'Google Doc', 'PDF Style', 'Email Body', 'JSON']} />
                  <Select label="Client Facing Versions Needed?" value={formData.client_facing_needed} onChange={v => update('client_facing_needed', v)} options={['Yes', 'No']} />
                  <Input label="Deadline (General)" value={formData.deadline} onChange={v => update('deadline', v)} />
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-deepTech-DEFAULT mb-4 border-b pb-2">J. References & Constraints</h3>
                <div className="space-y-4">
                  <TextArea label="Reference Brands to Emulate" value={formData.reference_brands} onChange={v => update('reference_brands', v)} />
                  <TextArea label="Hard Constraints (Budget, Tools, Time)" value={formData.hard_constraints} onChange={v => update('hard_constraints', v)} />
                  <TextArea label="MUST AVOID (Anti-patterns)" value={formData.must_avoid} onChange={v => update('must_avoid', v)} />
                </div>
              </section>
            </div>
          )}

        </div>

        {/* Footer Nav */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-between shrink-0">
          <button
            onClick={step === 1 || (isAddMode && step === 4) ? () => navigate('/dashboard') : prevStep}
            className="flex items-center text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> {step === 1 || (isAddMode && step === 4) ? 'Cancel' : 'Back'}
          </button>

          <button onClick={step === 6 || (isAddMode && step === 5) ? handleSubmit : nextStep} disabled={isSubmitting} className="bg-gradient-brand text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center shadow-lg shadow-cyan-electric/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" /> Submitting...
              </>
            ) : (
              step === 6 || (isAddMode && step === 5) ? (isAddMode ? 'Activate Expert' : 'Deploy Workmind OS') : <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

// UI Components (Reused)
const Input = ({ label, value, onChange, placeholder = '', required = false, error, className = '' }: any) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neural-DEFAULT focus:border-transparent outline-none text-sm ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    />
    {error && <span className="text-xs text-red-600 mt-1">{error}</span>}
  </div>
);

const TextArea = ({ label, value, onChange, className = '' }: any) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neural-DEFAULT outline-none text-sm h-24 resize-none"
      value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const Select = ({ label, value, onChange, options }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neural-DEFAULT outline-none text-sm bg-white"
      value={value} onChange={e => onChange(e.target.value)}>
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);
