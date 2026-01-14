
import React from 'react';
import { ArrowRight, CheckCircle2, FileText, Clock, BarChart3, Users, Globe, ShoppingCart, MessageSquare, Shield, Server, Lock, Zap, Workflow, Target, Play, Database, Brain, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BrainLogo } from './BrainLogo';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ui-bg font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo(0, 0)}>
              <div className="group-hover:scale-110 transition-transform duration-300">
                <BrainLogo />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-brand tracking-tight">WORKMIND.AI</span>
            </div>
            <div className="hidden md:flex space-x-8 text-gray-600 font-medium">
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-neural-DEFAULT transition-colors">How it Works</button>
              <button onClick={() => scrollToSection('features')} className="hover:text-neural-DEFAULT transition-colors">Features</button>
              <button onClick={() => scrollToSection('experts')} className="hover:text-neural-DEFAULT transition-colors">Experts</button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-neural-DEFAULT transition-colors">Pricing</button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/sign-in')}
                className="text-sm font-bold text-gray-600 hover:text-neural-DEFAULT px-4 py-2 transition-colors"
              >
                Login / Sign-Up
              </button>
              <button
                onClick={() => navigate('/intake')}
                className="bg-gradient-brand text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg hover:shadow-neural-DEFAULT/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Start Free Pilot
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-white">
        {/* Abstract Background elements */}
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-cyan-electric/10 to-transparent rounded-bl-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-gradient-to-tr from-midnight-DEFAULT/10 to-transparent rounded-tr-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neural-DEFAULT/5 border border-neural-DEFAULT/20 text-neural-dark text-xs font-bold uppercase tracking-wider mb-8 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-neural-DEFAULT animate-pulse"></span>
            Enterprise AI Operating System
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-ui-text leading-[1.1] animate-fadeIn animation-delay-100">
            Your Business Knowledge. <br />
            <span className="text-transparent bg-clip-text bg-gradient-brand">Now Active Intelligence.</span>
          </h1>
          <p className="text-xl text-ui-slate max-w-3xl mx-auto mb-10 leading-relaxed font-light animate-fadeIn animation-delay-200">
            Deploy specialized AI agents for Sales, Marketing, HR, and IT. <br className="hidden md:block" />
            Trained on <strong>your documents</strong>. Aligned to <strong>your goals</strong>. Ready in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center animate-fadeIn animation-delay-300">
            <button
              onClick={() => navigate('/intake')}
              className="bg-gradient-brand text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-neural-DEFAULT/30 transition-all duration-300 flex items-center justify-center gap-2 group transform hover:-translate-y-1"
            >
              Get Started Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="bg-white text-ui-text border-2 border-gray-200 px-10 py-4 rounded-xl font-bold text-lg hover:border-neural-DEFAULT hover:text-neural-DEFAULT transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <Play className="w-5 h-5 fill-current" /> How It Works
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section (Process Flow) */}
      <section id="how-it-works" className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-sm font-bold text-neural-DEFAULT uppercase tracking-wider mb-2">The Process</h2>
            <h3 className="text-4xl font-bold text-ui-text">From Documents to Deployment in 3 Steps</h3>
          </div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[10%] w-[80%] h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-teal-200 z-0 border-t-2 border-dashed border-gray-300"></div>

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {/* Step 1: Input */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-gray-100 group-hover:-translate-y-2 transition-transform duration-300 relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-brand rounded-full text-white font-bold flex items-center justify-center shadow-lg">1</div>
                  <FileText className="w-10 h-10 text-neural-DEFAULT" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Upload Context</h4>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                  Upload your PDFs, SOPs, past emails, and brand guidelines. We ingest your "Business DNA" into a secure, isolated repository.
                </p>
              </div>

              {/* Step 2: Configure */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-gray-100 group-hover:-translate-y-2 transition-transform duration-300 relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-brand rounded-full text-white font-bold flex items-center justify-center shadow-lg">2</div>
                  <Brain className="w-10 h-10 text-midnight-DEFAULT" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Neural Training</h4>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                  Our engine configures specialized experts (Sales, HR, etc.) with strict boundaries, defined roles, and no-hallucination protocols.
                </p>
              </div>

              {/* Step 3: Deploy */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-gray-100 group-hover:-translate-y-2 transition-transform duration-300 relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-brand rounded-full text-white font-bold flex items-center justify-center shadow-lg">3</div>
                  <Rocket className="w-10 h-10 text-deepTech-DEFAULT" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Active Workforce</h4>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                  Your team chats with experts in the Department Hubs to draft content, analyze data, and solve problems instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-neural-DEFAULT uppercase tracking-wider mb-2">Platform Capabilities</h2>
            <h3 className="text-3xl font-bold text-ui-text">Why Workmind is Different</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "No Hallucination Guarantee", desc: "Experts are strictly bounded by your context repository. If the answer isn't in your data, they won't guess." },
              { icon: Users, title: "Team Collaboration Hubs", desc: "Shared spaces where humans and AI agents collaborate. Tag @SalesExpert to draft a reply instantly." },
              { icon: Lock, title: "Enterprise Security", desc: "Your data is isolated. We use enterprise-grade encryption and never train public models on your proprietary IP." },
              { icon: Target, title: "Goal-Oriented Behavior", desc: "Agents aren't just chatbots. They are programmed with 90-day targets and specific KPIs." },
              { icon: FileText, title: "Document Analysis", desc: "Upload PDFs, contracts, and images directly. Agents can read, summarize, and extract data instantly." },
              { icon: Workflow, title: "Approval Workflows", desc: "Set boundaries. If an agent drafts a discount >15%, it automatically escalates to a human manager." }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-ui-card rounded-2xl border border-gray-100 hover:border-neural-DEFAULT/30 hover:shadow-lg transition-all duration-300 group">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-neural-DEFAULT group-hover:bg-gradient-brand group-hover:text-white transition-colors">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-ui-text">{item.title}</h3>
                <p className="text-ui-slate text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experts Showcase */}
      <section id="experts" className="py-24 bg-neural-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-neural-DEFAULT/20 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-cyan-electric uppercase tracking-wider mb-2">Your Workforce</h2>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Meet Your New Department Experts</h3>
            <p className="text-gray-400 max-w-2xl mx-auto mt-4">Specialized agents pre-configured with industry best practices, waiting for your data.</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { name: 'Sales Expert', icon: Users, desc: 'Generates proposals, handles objections, and drafts outreach sequences aligned to your pricing.' },
              { name: 'Marketing Expert', icon: Globe, desc: 'Creates campaign briefs, content calendars, and audience segments for your ICP.' },
              { name: 'Finance Expert', icon: BarChart3, desc: 'Tracks revenue, forecasts budget, and analyzes unit economics using your metrics.' },
              { name: 'HR Expert', icon: Users, desc: 'Writes JDs, interview kits, onboarding checklists, and policy guidance.' },
              { name: 'IT Expert', icon: Server, desc: 'Recommends tech stacks, security protocols, and infrastructure planning.' },
              { name: 'Social Media', icon: MessageSquare, desc: 'Audits social presence, analyzes engagement, and benchmarks competitors.' },
              { name: 'Procurement', icon: ShoppingCart, desc: 'Generates RFQs, compares suppliers, and summarizes contracts.' },
            ].map((exp, i) => (
              <div key={i} className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-electric/50">
                <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <exp.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">{exp.name}</h3>
                <p className="text-gray-400 text-sm leading-snug">{exp.desc}</p>
              </div>
            ))}
            <div className="p-6 bg-gradient-brand rounded-2xl flex flex-col justify-center items-center text-center shadow-lg shadow-cyan-electric/20 transform hover:scale-105 transition-all">
              <h3 className="text-xl font-bold mb-2">Ready to deploy?</h3>
              <p className="text-sm text-white/80 mb-4">Get your custom experts running in minutes.</p>
              <button onClick={() => navigate('/intake')} className="bg-white text-deepTech-DEFAULT px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-100 w-full transition-colors shadow-md">Get Started</button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-neural-DEFAULT uppercase tracking-wider mb-2">Pricing</h2>
            <h3 className="text-3xl font-bold text-ui-text">Simple, Scalable Pricing</h3>
            <p className="text-gray-500 mt-2">Start with a 14-day free pilot. No credit card required.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
              <h4 className="text-xl font-bold text-gray-900 mb-2">Starter</h4>
              <p className="text-sm text-gray-500 mb-6">For solopreneurs and small teams.</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">$49<span className="text-lg text-gray-400 font-normal">/mo</span></div>
              <button onClick={() => navigate('/intake')} className="w-full py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-neural-DEFAULT hover:text-neural-DEFAULT hover:bg-white transition-colors mb-8">Start Pilot</button>
              <ul className="space-y-4 text-sm text-gray-600 flex-1">
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> 1 Active Expert Agent</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Basic Context Repo (50MB)</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Standard Email Support</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> 500 AI Queries/mo</li>
              </ul>
            </div>

            {/* Growth */}
            <div className="bg-neural-dark rounded-3xl p-8 border border-gray-900 shadow-2xl transform md:-translate-y-4 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 bg-gradient-brand w-32 h-32 blur-3xl opacity-50"></div>
              <div className="inline-block bg-gradient-brand text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4 self-start">Most Popular</div>
              <h4 className="text-xl font-bold text-white mb-2">Growth</h4>
              <p className="text-sm text-gray-400 mb-6">For scaling companies & SMEs.</p>
              <div className="text-4xl font-bold text-white mb-6">$199<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <button onClick={() => navigate('/intake')} className="w-full py-3 bg-gradient-brand rounded-xl font-bold text-white hover:opacity-90 transition-opacity mb-8 shadow-lg shadow-cyan-electric/20">Start Pilot</button>
              <ul className="space-y-4 text-sm text-gray-300 flex-1">
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-cyan-electric shrink-0" /> Unlimited Experts</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-cyan-electric shrink-0" /> Full Context Repo (5GB)</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-cyan-electric shrink-0" /> Department Collaboration Hubs</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-cyan-electric shrink-0" /> Email Thread Analyzer Tool</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-cyan-electric shrink-0" /> Priority Support</li>
              </ul>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
              <h4 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h4>
              <p className="text-sm text-gray-500 mb-6">For large organizations.</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">Custom</div>
              <button className="w-full py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-neural-dark hover:text-neural-dark hover:bg-white transition-colors mb-8">Contact Sales</button>
              <ul className="space-y-4 text-sm text-gray-600 flex-1">
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Private Cloud Deployment</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Unlimited Storage & History</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> SSO & Audit Logs</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Dedicated Success Manager</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Custom Model Fine-tuning</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ui-bg border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
            <BrainLogo />
            <span className="font-bold text-ui-text">WORKMIND.AI</span>
          </div>
          <div className="text-sm text-ui-slate">
            © 2024 Workmind.ai. All rights reserved.
          </div>
          <div className="flex gap-4">
            <div className="text-ui-slate text-xs flex items-center gap-2">
              <Lock className="w-3 h-3" /> Secure Enterprise Environment
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
