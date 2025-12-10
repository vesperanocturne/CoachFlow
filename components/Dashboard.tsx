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
    <div className="max-w-6xl mx-auto p-6 space-y-8 pb-20">
      
      {/* Welcome / Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Your Coaching Profile
            {user.isPremium && <span className="ml-3 text-sm bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-bold px-2 py-1 rounded align-middle">PRO</span>}
          </h1>
          <p className="text-slate-400">Track your improvement across pitches and presentations.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors border border-slate-700"
          >
            {user.isPremium ? <Download size={20} /> : <Lock size={16} className="text-amber-400" />}
            Export Report
          </button>
          <button 
            onClick={onStartNew}
            className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            Start New Practice <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Achievements Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {myBadges.map((badge) => (
          <div key={badge.id} className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
            badge.unlocked 
              ? 'bg-slate-800 border-slate-700 opacity-100' 
              : 'bg-slate-900 border-slate-800 opacity-50 grayscale'
          }`}>
             <div className="text-2xl">{badge.icon}</div>
             <div>
               <h4 className="font-bold text-sm text-white">{badge.title}</h4>
               <p className="text-xs text-slate-500">{badge.description}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
              <TrendingUp />
            </div>
            <span className="text-green-400 text-sm font-bold">+12%</span>
          </div>
          <h3 className="text-slate-400 text-sm">Average Score</h3>
          <p className="text-3xl font-bold text-white">84.5</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
              <Trophy />
            </div>
            <span className="text-slate-500 text-sm">Total</span>
          </div>
          <h3 className="text-slate-400 text-sm">Sessions Completed</h3>
          <p className="text-3xl font-bold text-white">{history.length}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
           <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Calendar />
            </div>
            <span className="text-slate-500 text-sm">Streak</span>
          </div>
          <h3 className="text-slate-400 text-sm">Practice Streak</h3>
          <p className="text-3xl font-bold text-white">3 Days</p>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-80 relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Performance Trajectory</h3>
          {!user.isPremium && (
             <button onClick={onOpenPricing} className="text-xs flex items-center gap-1 text-amber-400 hover:text-amber-300">
               <Lock size={12} /> Unlock Advanced Analytics
             </button>
          )}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
               contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
               itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" />
            <Area type="monotone" dataKey="confidence" stroke="#10b981" fillOpacity={0} strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Last Session Review */}
      {lastSession && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white">Latest Session Analysis</h2>
            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded border border-slate-700">
              {lastSession.mode} • {lastSession.date}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Text Analysis Column */}
             <div className="space-y-6">
                <div>
                  <h4 className="text-slate-400 text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
                    <TrendingUp size={16} /> AI Executive Summary
                  </h4>
                  <p className="text-slate-200 leading-relaxed bg-slate-800/50 p-4 rounded-lg border border-slate-800">
                    {lastSession.transcriptSummary || "Processing session data..."}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800 p-4 rounded-lg text-center border border-slate-700">
                     <div className="text-2xl font-bold text-white">{lastSession.averageMetrics.confidence}</div>
                     <div className="text-xs text-slate-500 uppercase mt-1">Confidence</div>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg text-center border border-slate-700">
                     <div className="text-2xl font-bold text-white">{lastSession.averageMetrics.clarity}</div>
                     <div className="text-xs text-slate-500 uppercase mt-1">Clarity</div>
                  </div>
                   <div className="bg-slate-800 p-4 rounded-lg text-center border border-slate-700">
                     <div className="text-2xl font-bold text-white">{lastSession.averageMetrics.engagement}</div>
                     <div className="text-xs text-slate-500 uppercase mt-1">Engagement</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary-900/30 to-purple-900/30 p-5 rounded-lg border border-primary-500/20">
                  <h4 className="text-primary-400 text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                    <FileText size={16} /> Next Practice Script
                  </h4>
                  <p className="text-white italic font-serif text-lg leading-relaxed">
                    "{lastSession.improvementScript}"
                  </p>
                </div>
             </div>
             
             {/* Media Column */}
             <div className="space-y-6">
                {/* Video Player */}
                {lastSession.videoUrl ? (
                  <div className="rounded-xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
                    <h4 className="text-slate-500 text-xs uppercase p-3 bg-slate-900 flex items-center gap-2">
                      <VideoIcon size={14} /> Session Recording
                    </h4>
                    <video 
                      src={lastSession.videoUrl} 
                      controls 
                      className="w-full aspect-video bg-black"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden bg-slate-800 border border-slate-700 h-64 flex items-center justify-center text-slate-500">
                    No video recording available for this session.
                  </div>
                )}

                {/* Transcript Snippet */}
                {lastSession.transcript && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden relative">
                     <h4 className="text-slate-400 text-xs uppercase p-3 bg-slate-900/50 border-b border-slate-700 flex items-center gap-2">
                       <FileText size={14} /> Transcript Snippet
                       {!user.isPremium && <span className="ml-auto text-amber-500 flex items-center gap-1"><Lock size={10} /> Full Access Locked</span>}
                     </h4>
                     <div className={`p-4 max-h-40 overflow-y-auto text-sm text-slate-300 font-mono leading-relaxed ${!user.isPremium ? 'blur-sm select-none' : ''}`}>
                       {lastSession.transcript}
                     </div>
                     {!user.isPremium && (
                       <div className="absolute inset-0 flex items-center justify-center">
                         <button onClick={onOpenPricing} className="bg-slate-900/90 text-white px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 hover:bg-slate-800">
                           Upgrade to Read
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