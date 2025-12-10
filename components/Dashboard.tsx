
import React from 'react';
import { AnalysisResult, SessionData, User, Achievement } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, TrendingUp, Calendar, ArrowRight, Video as VideoIcon, FileText, Download, Lock, Medal } from 'lucide-react';

interface DashboardProps {
  history: SessionData[];
  onStartNew: () => void;
  lastSession: SessionData | null;
  user: User;
  onOpenPricing: () => void;
}

const BADGES: Achievement[] = [
  { id: 'first-step', title: 'First Step', description: 'Complete your first practice session', icon: '🌱', unlocked: false },
  { id: 'confidence-boost', title: 'Confident Speaker', description: 'Score > 80% Confidence', icon: '🦁', unlocked: false },
  { id: 'streak-3', title: 'Consistent', description: '3 Day Streak', icon: '🔥', unlocked: false },
  { id: 'pro-member', title: 'Pro League', description: 'Upgrade to Premium', icon: '👑', unlocked: false },
];

const Dashboard: React.FC<DashboardProps> = ({ history, onStartNew, lastSession, user, onOpenPricing }) => {
  
  // Create dataset for chart
  const data = history.map((h, i) => ({
    name: `Session ${i + 1}`,
    score: (h.averageMetrics.confidence + h.averageMetrics.clarity + h.averageMetrics.engagement + h.averageMetrics.contentRelevance) / 4,
    confidence: h.averageMetrics.confidence
  }));

  const handleExport = () => {
    if (!user.isPremium) {
      onOpenPricing();
    } else {
      alert("Downloading detailed PDF report...");
    }
  };

  // Resolve achievements
  const myBadges = BADGES.map(b => {
    const isUnlocked = user.achievements?.includes(b.id) || (b.id === 'pro-member' && user.isPremium);
    return { ...b, unlocked: isUnlocked };
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 pb-20 animate-fade-up">
      
      {/* Welcome / Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Your Coaching Profile
            {user.isPremium && <span className="ml-3 text-xs bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-900 font-bold px-2 py-1 rounded-md shadow-lg shadow-amber-500/20 align-middle">PRO</span>}
          </h1>
          <p className="text-slate-400">Track your improvement across pitches and presentations.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="glass-panel hover:bg-white/5 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all border border-white/5 hover:border-white/10"
          >
            {user.isPremium ? <Download size={18} /> : <Lock size={16} className="text-amber-400" />}
            Export Report
          </button>
          <button 
            onClick={onStartNew}
            className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95"
          >
            Start New Practice <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Achievements Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {myBadges.map((badge, idx) => (
          <div key={badge.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all duration-500 hover:scale-[1.02] ${idx === 0 ? 'delay-100' : idx === 1 ? 'delay-200' : idx === 2 ? 'delay-300' : 'delay-400'} animate-fade-up ${
            badge.unlocked 
              ? 'bg-slate-800/50 border-slate-700 shadow-lg' 
              : 'bg-slate-900/50 border-slate-800 opacity-60 grayscale'
          }`}>
             <div className="text-3xl drop-shadow-md">{badge.icon}</div>
             <div>
               <h4 className="font-bold text-sm text-white">{badge.title}</h4>
               <p className="text-xs text-slate-500">{badge.description}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl animate-fade-up delay-100 hover:bg-slate-800/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <TrendingUp size={24} />
            </div>
            <span className="text-green-400 text-sm font-bold bg-green-500/10 px-2 py-1 rounded-full">+12%</span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Average Score</h3>
          <p className="text-4xl font-bold text-white mt-1">84.5</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl animate-fade-up delay-200 hover:bg-slate-800/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Trophy size={24} />
            </div>
            <span className="text-slate-500 text-sm">Total</span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Sessions Completed</h3>
          <p className="text-4xl font-bold text-white mt-1">{history.length}</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl animate-fade-up delay-300 hover:bg-slate-800/50 transition-colors">
           <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Calendar size={24} />
            </div>
            <span className="text-slate-500 text-sm">Streak</span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Practice Streak</h3>
          <p className="text-4xl font-bold text-white mt-1">3 Days</p>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="glass-panel p-8 rounded-3xl border border-white/5 h-96 relative animate-fade-up delay-300">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-500" />
            Performance Trajectory
          </h3>
          {!user.isPremium && (
             <button onClick={onOpenPricing} className="text-xs font-bold flex items-center gap-1 text-amber-400 hover:text-amber-300 bg-amber-900/20 px-3 py-1 rounded-full border border-amber-500/20 transition-all hover:bg-amber-900/30">
               <Lock size={12} /> Unlock Advanced Analytics
             </button>
          )}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} dx={-10} />
            <Tooltip 
               contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
               itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
            <Area type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2} fillOpacity={0} strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Last Session Review */}
      {lastSession && (
        <div className="glass-panel rounded-3xl p-8 animate-fade-up delay-400">
          <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
            <div className="p-3 bg-primary-600/20 rounded-xl text-primary-400">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Latest Session Analysis</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-400 text-sm">{lastSession.date}</span>
                <span className="text-slate-600 text-xs">•</span>
                <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full border border-slate-700">
                  {lastSession.mode}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Text Analysis Column */}
             <div className="space-y-6">
                <div>
                  <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">AI Executive Summary</h4>
                  <p className="text-slate-200 leading-relaxed bg-slate-950/50 p-6 rounded-2xl border border-white/5 shadow-inner">
                    {lastSession.transcriptSummary || "Processing session data..."}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900/50 p-4 rounded-2xl text-center border border-white/5 hover:border-white/10 transition-colors">
                     <div className="text-3xl font-bold text-white">{lastSession.averageMetrics.confidence}</div>
                     <div className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">Confidence</div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-2xl text-center border border-white/5 hover:border-white/10 transition-colors">
                     <div className="text-3xl font-bold text-white">{lastSession.averageMetrics.clarity}</div>
                     <div className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">Clarity</div>
                  </div>
                   <div className="bg-slate-900/50 p-4 rounded-2xl text-center border border-white/5 hover:border-white/10 transition-colors">
                     <div className="text-3xl font-bold text-white">{lastSession.averageMetrics.engagement}</div>
                     <div className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">Engagement</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary-900/40 to-purple-900/40 p-6 rounded-2xl border border-primary-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Medal size={64} />
                  </div>
                  <h4 className="text-primary-300 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                    Next Practice Goal
                  </h4>
                  <p className="text-white italic font-serif text-xl leading-relaxed relative z-10">
                    "{lastSession.improvementScript}"
                  </p>
                </div>
             </div>
             
             {/* Media Column */}
             <div className="space-y-6">
                {/* Video Player */}
                {lastSession.videoUrl ? (
                  <div className="rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl relative group">
                    <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <h4 className="text-white text-xs font-bold uppercase flex items-center gap-2">
                        <VideoIcon size={14} /> Session Recording
                      </h4>
                    </div>
                    <video 
                      src={lastSession.videoUrl} 
                      controls 
                      className="w-full aspect-video bg-black"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden bg-slate-900/50 border border-white/5 h-64 flex flex-col items-center justify-center text-slate-500 gap-3">
                    <VideoIcon size={32} className="opacity-50" />
                    <span>No video recording available</span>
                  </div>
                )}

                {/* Transcript Snippet */}
                {lastSession.transcript && (
                  <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden relative">
                     <h4 className="text-slate-400 text-xs font-bold uppercase p-4 border-b border-white/5 flex items-center gap-2">
                       <FileText size={14} /> Transcript Snippet
                       {!user.isPremium && <span className="ml-auto text-amber-500 flex items-center gap-1 bg-amber-950/30 px-2 py-0.5 rounded text-[10px]"><Lock size={8} /> Pro Feature</span>}
                     </h4>
                     <div className={`p-6 max-h-48 overflow-y-auto text-sm text-slate-300 font-mono leading-relaxed ${!user.isPremium ? 'blur-sm select-none opacity-50' : ''}`}>
                       {lastSession.transcript}
                     </div>
                     {!user.isPremium && (
                       <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]">
                         <button onClick={onOpenPricing} className="bg-slate-950 text-white px-6 py-3 rounded-xl text-sm font-bold border border-white/10 hover:bg-slate-900 shadow-2xl transform hover:scale-105 transition-all">
                           Unlock Full Transcript
                         </button>
                       </div>
                     )}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
