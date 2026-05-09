import { Database, Users, FileText, Globe, AlertTriangle, Brain, Shield, Rocket } from 'lucide-react';

export default function HowItWorksPanel() {
  const steps = [
    {
      title: "1. Global Knowledge Repository",
      description:
        "Centralize your organization's 'Business DNA'. Upload SOPs, company policies, brand guidelines, and strategy documents that provide the fundamental context for all AI experts across the platform.",
      icon: Database,
      color: "text-blue-400"
    },
    {
      title: "2. Specialized Expert Workspaces",
      description:
        "Every department—HR, Finance, Marketing, Sales—operates in its own dedicated workspace. This eliminates fragmented chats and ensures that discussions remain focused on specific departmental goals.",
      icon: Users,
      color: "text-purple-400"
    },
    {
      title: "3. Departmental Deep-Context",
      description:
        "Inside each workspace, upload specialized files like spreadsheets, meeting notes, and project reports. This creates a hyper-aware AI expert that understands the nuances of individual team operations.",
      icon: FileText,
      color: "text-teal-400"
    },
    {
      title: "4. Dynamic Web Intelligence",
      description:
        "Bridge the gap between internal data and live web sources. Use the dedicated Context section to scrape websites, Instagram profiles, or LinkedIn pages for real-time market and competitor intelligence.",
      icon: Globe,
      color: "text-cyan-400"
    },
    {
      title: "5. Structured Knowledge Extraction",
      description:
        "To ensure high-accuracy scraping, always use the dedicated Context Panel. Pasting links directly into chat messages is restricted as it prevents the system from properly indexing the operational data.",
      icon: AlertTriangle,
      color: "text-amber-400"
    },
    {
      title: "6. Institutional Memory",
      description:
        "TheWorkimnd builds a long-term operational asset. Knowledge uploaded today remains accessible and active for your team tomorrow, preventing 'brain drain' and ensuring continuity in execution.",
      icon: Brain,
      color: "text-indigo-400"
    },
  ];


  return (
    <div className="min-h-screen bg-[#0B1020] text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6">
            <Rocket className="w-4 h-4" /> Operational OS
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            How TheWorkimnd Works
          </h1>

          <p className="text-lg text-slate-400 max-w-3xl leading-relaxed font-medium">
            TheWorkimnd is an Operational OS designed for coordinated business intelligence. 
            By organizing your proprietary data into structured AI environments, we transform static documents into active departmental expertise.
          </p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group bg-[#0F172A] border border-slate-800 rounded-[2rem] p-8 hover:border-indigo-500/50 hover:bg-[#131C35] transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] group-hover:bg-indigo-500/10 transition-all pointer-events-none"></div>
              
              <div className={`w-14 h-14 rounded-2xl bg-slate-900/50 flex items-center justify-center mb-6 border border-slate-800 group-hover:scale-110 transition-transform ${step.color}`}>
                <step.icon className="w-7 h-7" />
              </div>

              <h2 className="text-xl font-bold mb-3 text-white tracking-tight">
                {step.title}
              </h2>

              <p className="text-slate-400 leading-relaxed text-sm font-medium">
                {step.description}
              </p>
            </div>

          ))}
        </div>

        <div className="mt-12 bg-gradient-to-br from-[#1E294B] to-[#0F172A] rounded-[2.5rem] p-10 border border-slate-800 relative overflow-hidden">
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
          
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-indigo-400" /> The Strategic Advantage
          </h2>

          <p className="text-slate-300 leading-relaxed text-lg max-w-5xl font-medium">
            Traditional AI operates in isolated chat windows, leading to information loss and operational silos. 
            <strong> TheWorkimnd</strong> centralizes your organizational knowledge, ensuring that every AI expert 
            possesses a persistent, unified understanding of your business goals, allowing for seamless scaling and superior decision-making.
          </p>
        </div>

      </div>
    </div>
  );
}
