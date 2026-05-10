import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainLogo } from '../BrainLogo';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SignInPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 lg:p-12 relative animate-fadeIn">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left mb-8">
            <div className="flex justify-center lg:justify-start items-center gap-3 mb-4 group cursor-pointer" onClick={() => window.location.href = '/'}>
              <div className="bg-indigo-600 p-2 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-indigo-200">
                <BrainLogo width={32} height={32} />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-brand tracking-tight">TheWorkMind.AI</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-6 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 mt-2 text-lg">Access your AI department experts.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            />
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Access is invite-only. Join the waitlist from the landing page if you have not been approved yet.
            </p>
          </form>

          <div className="pt-6 text-center text-xs text-gray-400">
            Secure Enterprise Environment | SOC2 Compliant
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-[#0f172a] relative overflow-hidden items-center justify-center">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

        <div className="relative z-10 max-w-xl p-12 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-sm">
            <Sparkles className="w-3 h-3" /> New Generation AI
          </div>

          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Your Business Data. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Activated.</span>
          </h2>

          <p className="text-xl text-gray-400 mb-10 leading-relaxed font-light">
            Deploy specialized AI agents that understand your documents, brand, and goals. The workforce of tomorrow is here.
          </p>

          <div className="space-y-4">
            {[
              'Context-aware AI Experts',
              'Secure Enterprise Data Silos',
              'Real-time Collaboration Hubs',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="font-medium text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

