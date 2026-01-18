import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { BrainLogo } from '../BrainLogo';
import { CheckCircle2, Sparkles, Rocket } from 'lucide-react';

export const SignUpPage: React.FC = () => {
    return (
        <div className="min-h-screen flex bg-white font-sans overflow-hidden">
            {/* Left Panel - Form */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 lg:p-12 relative animate-fadeIn">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo Heading */}
                    <div className="text-center lg:text-left mb-6">
                        <div className="flex justify-center lg:justify-start items-center gap-3 mb-4 group cursor-pointer" onClick={() => window.location.href = '/'}>
                            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-cyan-200">
                                <BrainLogo width={32} height={32} />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-brand tracking-tight">WORKMIND.AI</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mt-6 tracking-tight">Create your account</h1>
                        <p className="text-gray-500 mt-2 text-lg">Deploy your first AI workforce in minutes.</p>
                    </div>

                    {/* Clerk Component Wrapper */}
                    <div className="w-full">
                        <SignUp
                            path="/sign-up"
                            signInUrl="/sign-in"
                            forceRedirectUrl="/dashboard"
                            appearance={{
                                elements: {
                                    rootBox: "w-full",
                                    card: "shadow-none p-0 w-full border-0",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    formButtonPrimary: "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-sm normal-case",
                                    footerActionLink: "text-indigo-600 hover:text-indigo-700",
                                    formFieldInput: "rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all",
                                    socialButtonsBlockButton: "rounded-xl border-gray-200 hover:bg-gray-50 transition-all text-gray-600 font-medium",
                                    dividerLine: "bg-gray-200",
                                    dividerText: "text-gray-400 bg-white"
                                }
                            }}
                        />
                    </div>

                    <div className="pt-4 text-center text-xs text-gray-400">
                        By joining, you agree to our Enterprise Terms & Privacy Policy.
                    </div>
                </div>
            </div>

            {/* Right Panel - Visuals */}
            <div className="hidden lg:flex flex-1 bg-[#0f172a] relative overflow-hidden items-center justify-center">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>

                {/* Abstract Grid */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

                {/* Content */}
                <div className="relative z-10 max-w-xl p-12 text-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-sm">
                        <Rocket className="w-3 h-3" /> Start Your Pilot
                    </div>

                    <h2 className="text-5xl font-bold mb-6 leading-tight">
                        Scale Your Team <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Infinitely.</span>
                    </h2>

                    <p className="text-xl text-gray-400 mb-10 leading-relaxed font-light">
                        Join thousands of forward-thinking companies automating their operations with Context-Aware AI Agents.
                    </p>

                    <div className="space-y-4">
                        {[
                            "14-Day Free Enterprise Pilot",
                            "Access to All Department Experts",
                            "No Credit Card Required"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
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
