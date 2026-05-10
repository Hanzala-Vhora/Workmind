import React, { useState } from 'react';
import { Star, Check, AlertCircle, Loader2, Send, Clock, DollarSign, Heart, Layout, Users, Zap, MessageSquare, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'form' | 'success'>('intro');
  const [loading, setLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);


  const [formData, setFormData] = useState({
    rating: 0,
    valuableFeatures: [] as string[],
    improvements: '',
    departments: [] as string[],
    continueUsing: '',
    startTime: '',
    pricingRange: '',
    mustHaveFeature: ''
  });

  React.useEffect(() => {
    if (isOpen && user?.id) {
        checkStatus();
    }
  }, [isOpen, user?.id]);

  const checkStatus = async () => {
    setIsCheckingStatus(true);
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/check/${user?.id}`);
        if (res.ok) {
            const data = await res.json();
            if (data.hasSubmitted) {
                setStep('success');
            } else {
                setStep('intro');
            }
        }
    } catch (err) {
        console.error("Failed to check feedback status", err);
    } finally {
        setIsCheckingStatus(false);
    }
  };

  if (!isOpen) return null;


  const handleRating = (r: number) => setFormData({ ...formData, rating: r });
  
  const toggleMultiSelect = (field: 'valuableFeatures' | 'departments', value: string) => {
    const current = formData[field];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter(v => v !== value) });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const handleSubmit = async () => {
    if (!formData.rating || !formData.continueUsing) {
        alert("Please provide at least a rating and whether you'd like to continue using TheWorkimnd.");
        return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.id,
          email: user?.email
        }),
      });

      if (response.ok) {
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`feedback_submitted_${user.id}`, 'true');
        }
        setStep('success');
      } else {

        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const VALUABLE_FEATURES = [
    'Organized AI workspaces',
    'Department-specific experts',
    'Better collaboration',
    'Faster execution',
    'Document understanding',
    'Workflow automation',
    'Team alignment',
    'Centralized business context',
    'Other'
  ];

  const DEPARTMENTS = [
    'HR', 'Finance', 'Marketing', 'Operations', 'IT', 'Procurement', 'Leadership / Management', 'Customer Support', 'Sales', 'Other'
  ];

  const PRICING_RANGES = [
    'Under $100 per seat/month',
    '$100–$300 per seat/month',
    '$300–$700 per seat/month',
    '$700–$1500 per seat/month',
    'Enterprise custom pricing'
  ];


  const START_TIMES = [
    'Immediately',
    'Within 30 days',
    'Within 3 months',
    'Exploring for future use'
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden relative border border-gray-100 flex flex-col max-h-[90vh]">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all z-[10]"
        >
          <X className="w-6 h-6" />
        </button>
        
        {isCheckingStatus ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Securing Session...</p>
            </div>
        ) : (
            <>
        {/* Progress Bar (if in form) */}
        {step === 'form' && (
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
                <div 
                    className="h-full bg-indigo-600 transition-all duration-500" 
                    style={{ width: `${(Object.values(formData).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length / 8) * 100}%` }}
                />
            </div>
        )}

        {step === 'intro' && (
          <div className="flex-1 overflow-y-auto p-8 md:p-12 text-center custom-scrollbar">

            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                <Heart className="w-10 h-10 text-indigo-600 fill-indigo-600/10" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Enjoying TheWorkimnd?</h2>
            <div className="space-y-4 text-gray-600 text-lg mb-10 leading-relaxed">
              <p>Thank you for using TheWorkimnd.ai.</p>
              <p>We’d love to understand your experience so far and how we can improve the platform for your team.</p>
              <p className="text-base text-gray-400">Your feedback helps us shape better AI workspaces, workflows, and experts built around real business operations.</p>
              <p className="font-bold text-indigo-600 text-sm uppercase tracking-widest">This will only take 1–2 minutes.</p>
            </div>
            <button 
              onClick={() => setStep('form')}
              className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 group"
            >
              Share Feedback
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 'form' && (
          <div className="flex flex-col flex-1 min-h-0">

            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-black text-gray-900">Help Us Improve TheWorkimnd</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Tell us what worked, what didn’t, and how you see TheWorkimnd fitting in.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
              {/* Q1: Rating */}
              <section>
                <label className="block text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">1. How would you rate your experience with TheWorkimnd?</label>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRating(r)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-2 ${formData.rating >= r ? 'bg-amber-50 border-amber-400 text-amber-500 shadow-sm' : 'bg-white border-gray-100 text-gray-300 hover:border-gray-200'}`}
                    >
                      <Star className={`w-7 h-7 ${formData.rating >= r ? 'fill-amber-500' : ''}`} />
                    </button>
                  ))}
                </div>
              </section>

              {/* Q2: Valuable Features */}
              <section>
                <label className="block text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">2. What did you find most valuable about TheWorkimnd?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VALUABLE_FEATURES.map((feature) => (
                    <button
                      key={feature}
                      onClick={() => toggleMultiSelect('valuableFeatures', feature)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${formData.valuableFeatures.includes(feature) ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'}`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${formData.valuableFeatures.includes(feature) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200'}`}>
                        {formData.valuableFeatures.includes(feature) && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-sm">{feature}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Q3: Improvements */}
              <section>
                <label className="block text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">3. What felt unclear, missing, or needs improvement?</label>
                <textarea
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-600 outline-none transition-all min-h-[120px] text-gray-700 bg-gray-50/50"
                  placeholder="Share your thoughts..."
                  value={formData.improvements}
                  onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                />
              </section>

              {/* Q4: Departments */}
              <section>
                <label className="block text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">4. Which departments would you use TheWorkimnd for?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => toggleMultiSelect('departments', dept)}
                      className={`px-3 py-2 rounded-xl border-2 text-center text-xs transition-all ${formData.departments.includes(dept) ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'}`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </section>

              {/* Q5: Continue using */}
              <section>
                <label className="block text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">5. Would you like to continue using TheWorkimnd?</label>
                <div className="flex gap-4">
                  {['Yes', 'Maybe', 'No'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setFormData({ ...formData, continueUsing: opt })}
                      className={`flex-1 py-3 rounded-xl border-2 text-center font-bold transition-all ${formData.continueUsing === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </section>

              {/* Q6: How soon */}
              {formData.continueUsing === 'Yes' && (
                <section className="animate-slideDown">
                  <label className="block text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">6. If yes, how soon would you like to start?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {START_TIMES.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setFormData({ ...formData, startTime: opt })}
                        className={`px-4 py-3 rounded-xl border-2 text-left text-sm transition-all ${formData.startTime === opt ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Q7: Pricing */}
              <section>
                <label className="block text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">7. What monthly pricing range would feel reasonable per user license / seat for your organization?</label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRICING_RANGES.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setFormData({ ...formData, pricingRange: opt })}
                      className={`px-4 py-3 rounded-xl border-2 text-left text-sm transition-all ${formData.pricingRange === opt ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </section>

              {/* Q8: Must-have feature */}
              <section>
                <label className="block text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">8. What would make TheWorkimnd a must-have for your business?</label>
                <textarea
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-600 outline-none transition-all min-h-[100px] text-gray-700 bg-gray-50/50"
                  placeholder="Your dream feature..."
                  value={formData.mustHaveFeature}
                  onChange={(e) => setFormData({ ...formData, mustHaveFeature: e.target.value })}
                />
              </section>
            </div>

            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 bg-gray-50/50">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Feedback</>}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex-1 overflow-y-auto p-12 text-center animate-fadeIn custom-scrollbar">

            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Feedback Received!</h2>
            <p className="text-gray-500 text-lg max-w-sm mx-auto mb-6">Thank you for helping us make TheWorkimnd better. We appreciate your time.</p>
            <div className="p-6 bg-indigo-50/50 rounded-[24px] border border-indigo-100 max-w-lg mx-auto">
                <p className="text-gray-700 leading-relaxed mb-4">
                    Our team will review your submission and get back to you shortly with access to the official platform website, where you’ll be able to sign up, onboard your team, and start using the SaaS platform across your organization.
                </p>
                <p className="text-indigo-600 font-bold">
                    We appreciate your time and participation.
                </p>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};
