import React from 'react';
import { ArrowRight, Mic, Video, Zap, Activity, CheckCircle2, Play, ChevronRight, BarChart3, Shield, Award } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-primary-500/30 overflow-x-hidden relative">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-slate-950/70 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight text-white cursor-pointer hover:opacity-90 transition-opacity">
            <div className="relative">
              <span className="absolute inset-0 bg-primary-500 blur-lg opacity-50 rounded-xl"></span>
              <span className="relative bg-gradient-to-br from-primary-500 to-primary-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-white">C</span>
            </div>
            CoachFlow
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={onLogin}
              className="text-slate-300 hover:text-white font-medium px-2 py-2 transition-colors relative group"
            >
              Log In
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 transition-all group-hover:w-full"></span>
            </button>
            <button 
              onClick={onSignup}
              className="group relative px-6 py-2.5 rounded-lg font-bold text-white overflow-hidden shadow-lg shadow-primary-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 transition-all group-hover:brightness-110"></div>
              <span className="relative flex items-center gap-2">Get Started <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-32 lg:pt-48 lg:pb-40">
        {/* Animated Background Blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob delay-4000"></div>
        
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-700/50 text-primary-300 text-sm font-medium mb-8 animate-fade-in backdrop-blur-sm hover:border-primary-500/50 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            Powered by Gemini 3.0 Agentic AI
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 tracking-tighter mb-8 animate-fade-up leading-tight">
            Speak Like <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-purple-400 text-glow">A Leader.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-up delay-100">
            Real-time, multimodal AI coaching for your sales pitches, interviews, and presentations. Get instant feedback on tone, pace, and body language.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-up delay-200">
            <button 
              onClick={onSignup}
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all hover:scale-105 shadow-xl shadow-white/10 flex items-center justify-center gap-2"
            >
              Start Coaching Free
            </button>
            <button 
              className="w-full sm:w-auto px-8 py-4 bg-slate-900/50 border border-slate-700 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all hover:scale-105 flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <Play size={20} className="fill-white" /> Watch Demo
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-32 relative">
        <div className="absolute inset-0 bg-slate-900/50 skew-y-3 transform origin-bottom-right -z-10"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Total Performance Analysis</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Our engine breaks down every micro-signal in your communication.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              delay="delay-0"
              icon={<Video className="text-blue-400" size={32} />}
              title="Visual Presence"
              description="Tracks eye contact, posture, and facial expressions. Learn to command the room without saying a word."
              gradient="from-blue-500/20 to-blue-600/5"
            />
            <FeatureCard 
              delay="delay-100"
              icon={<Mic className="text-purple-400" size={32} />}
              title="Vocal Dynamics"
              description="Detects filler words, pacing issues, and tonal variety. Remove 'ums' and 'ahs' forever."
              gradient="from-purple-500/20 to-purple-600/5"
            />
            <FeatureCard 
              delay="delay-200"
              icon={<Zap className="text-yellow-400" size={32} />}
              title="Real-Time Cues"
              description="Get instant, non-intrusive HUD notifications. Fix your pacing or smile more, right in the moment."
              gradient="from-yellow-500/20 to-yellow-600/5"
            />
          </div>
        </div>
      </div>

      {/* Interactive Preview Section */}
      <div className="py-32 max-w-7xl mx-auto px-6">
        <div className="glass-panel rounded-[40px] p-8 md:p-16 border border-white/10 relative overflow-hidden group">
           {/* Background Glow */}
           <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-600/20 rounded-full blur-[80px] group-hover:bg-primary-500/30 transition-colors duration-700"></div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 text-primary-400 font-bold uppercase tracking-wider text-sm">
                  <BarChart3 size={16} /> Analytics Dashboard
                </div>
                <h3 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  Data-driven <br/> confidence.
                </h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Stop guessing how you did. Get concrete scores on Clarity, Confidence, and Engagement. Track your improvement over time with detailed trend lines.
                </p>
                <div className="flex flex-col gap-4">
                  <ListItem text="Post-session heatmap analysis" />
                  <ListItem text="AI-generated improvement scripts" />
                  <ListItem text="Exportable PDF reports for managers" />
                </div>
                <button onClick={onSignup} className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-primary-50 transition-colors flex items-center gap-2 mt-4 w-fit">
                  Try Dashboard Demo <ChevronRight size={18} />
                </button>
              </div>

              {/* Floating UI Mockup */}
              <div className="relative animate-float">
                 {/* Abstract Card Stack */}
                 <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl opacity-20 blur-xl transform translate-x-4 translate-y-4"></div>
                 
                 <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
                    {/* Header Mock */}
                    <div className="flex justify-between items-center mb-8">
                       <div className="flex gap-3">
                          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
                             <Award className="text-yellow-400" size={24} />
                          </div>
                          <div>
                             <div className="h-3 w-24 bg-slate-800 rounded mb-2"></div>
                             <div className="h-2 w-16 bg-slate-800/50 rounded"></div>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-2xl font-bold text-white">94%</div>
                          <div className="text-xs text-green-400 uppercase font-bold">Excellent</div>
                       </div>
                    </div>

                    {/* Chart Mock */}
                    <div className="flex items-end gap-2 h-40 mb-6">
                       {[40, 65, 50, 80, 60, 90, 85].map((h, i) => (
                          <div key={i} className="flex-1 bg-slate-800/50 rounded-t-lg relative group overflow-hidden" style={{ height: `${h}%` }}>
                             <div className="absolute bottom-0 left-0 w-full bg-primary-500/80 h-0 transition-all duration-1000 group-hover:h-full" style={{ height: `${h}%`, transitionDelay: `${i * 100}ms` }}></div>
                          </div>
                       ))}
                    </div>

                    {/* Floating Feedback Bubble */}
                    <div className="absolute -bottom-4 -left-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                        <div className="bg-green-500/20 p-2 rounded-full text-green-400">
                           <Shield size={20} />
                        </div>
                        <div>
                           <div className="text-xs text-slate-400 font-bold uppercase">Clarity Score</div>
                           <div className="text-white font-bold">+15% vs last week</div>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-3 font-bold text-2xl tracking-tight text-white">
              <span className="bg-slate-800 w-10 h-10 rounded-xl flex items-center justify-center text-slate-400">C</span>
              CoachFlow
            </div>
            <div className="flex gap-8 text-slate-400 text-sm font-medium">
              <a href="#" className="hover:text-white transition-colors">Features</a>
              <a href="#" className="hover:text-white transition-colors">Pricing</a>
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-900 text-center text-slate-600 text-sm">
            © {new Date().getFullYear()} CoachFlow AI. Designed for professionals.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper Components
const FeatureCard = ({ icon, title, description, gradient, delay }: { icon: React.ReactNode, title: string, description: string, gradient: string, delay: string }) => (
  <div className={`p-8 rounded-3xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-600/50 transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden animate-fade-up ${delay}`}>
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
    <div className="relative z-10">
      <div className="mb-6 bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border border-slate-800 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-base">{description}</p>
    </div>
  </div>
);

const ListItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3 text-slate-300 group">
    <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-colors">
      <CheckCircle2 size={14} strokeWidth={3} />
    </div>
    <span className="font-medium">{text}</span>
  </div>
);

export default LandingPage;