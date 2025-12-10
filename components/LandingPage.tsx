import React from 'react';
import { ArrowRight, Mic, Video, Zap, Activity, CheckCircle2, Play } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-primary-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight text-white">
            <span className="bg-primary-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">C</span>
            CoachFlow
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogin}
              className="text-slate-300 hover:text-white font-medium px-4 py-2 transition-colors"
            >
              Log In
            </button>
            <button 
              onClick={onSignup}
              className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg hover:shadow-primary-500/25 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-32">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-primary-400 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            Powered by Gemini 3.0
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tighter mb-6 animate-in fade-in zoom-in-90 duration-1000">
            CoachFlow
          </h1>
          
          <h2 className="text-3xl md:text-5xl font-bold text-slate-200 tracking-tight mb-8 max-w-4xl mx-auto leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Master your communication with <span className="text-primary-400">Real-Time AI Coaching</span>
          </h2>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            CoachFlow analyzes your speech, tone, and body language instantly during practice sessions to help you ace interviews, sales pitches, and presentations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <button 
              onClick={onSignup}
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              Start Coaching Free <ArrowRight size={20} />
            </button>
            <button 
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-700 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} className="fill-white" /> Watch Demo
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Everything you need to speak with confidence</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Our multimodal AI engine breaks down every aspect of your delivery in real-time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Video className="text-blue-400" size={32} />}
              title="Visual Analysis"
              description="Tracks eye contact, posture, and facial expressions to ensure you look as confident as you sound."
            />
            <FeatureCard 
              icon={<Mic className="text-purple-400" size={32} />}
              title="Speech Metrics"
              description="Detects filler words, pacing issues, and tonal variety to help you speak clearly and persuasively."
            />
            <FeatureCard 
              icon={<Zap className="text-yellow-400" size={32} />}
              title="Live Suggestions"
              description="Get instant, non-intrusive feedback cues on your screen while you are speaking."
            />
          </div>
        </div>
      </div>

      {/* App Preview / Social Proof */}
      <div className="py-24 max-w-7xl mx-auto px-6">
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 md:p-12 overflow-hidden relative">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-6">Track your progress over time</h3>
                <ul className="space-y-4 mb-8">
                  <ListItem text="Detailed post-session analytics dashboard" />
                  <ListItem text="Historical trend lines for confidence & clarity" />
                  <ListItem text="AI-generated improvement scripts tailored to you" />
                  <ListItem text="Exportable reports for sales managers" />
                </ul>
                <button onClick={onSignup} className="text-primary-400 font-bold hover:text-primary-300 flex items-center gap-2">
                  View Dashboard Features <ArrowRight size={18} />
                </button>
              </div>
              <div className="relative">
                 {/* Abstract UI representation */}
                 <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                    <div className="flex justify-between items-center mb-4">
                       <div className="h-4 w-24 bg-slate-800 rounded"></div>
                       <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                          <Activity size={16} />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <div className="h-32 bg-slate-900 rounded-lg w-full border border-slate-800 flex items-end p-2 gap-1">
                          <div className="bg-primary-600/40 w-full rounded-sm h-[40%]"></div>
                          <div className="bg-primary-600/60 w-full rounded-sm h-[60%]"></div>
                          <div className="bg-primary-600/80 w-full rounded-sm h-[50%]"></div>
                          <div className="bg-primary-600 w-full rounded-sm h-[75%]"></div>
                          <div className="bg-primary-500 w-full rounded-sm h-[90%]"></div>
                       </div>
                       <div className="h-4 w-3/4 bg-slate-800 rounded"></div>
                       <div className="h-4 w-1/2 bg-slate-800 rounded"></div>
                    </div>
                 </div>
                 {/* Floating Badge */}
                 <div className="absolute -bottom-6 -left-6 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl flex items-center gap-3">
                    <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                       <TrendingUpIcon />
                    </div>
                    <div>
                       <div className="text-xs text-slate-400">Improvement</div>
                       <div className="text-lg font-bold text-white">+24%</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-500">
            <span className="bg-slate-800 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400">C</span>
            CoachFlow
          </div>
          <div className="text-slate-500 text-sm">
            © {new Date().getFullYear()} CoachFlow AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper Components
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors">
    <div className="mb-4 bg-slate-900 w-fit p-3 rounded-xl">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{description}</p>
  </div>
);

const ListItem = ({ text }: { text: string }) => (
  <li className="flex items-center gap-3 text-slate-300">
    <CheckCircle2 size={20} className="text-primary-500 shrink-0" />
    {text}
  </li>
);

const TrendingUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

export default LandingPage;