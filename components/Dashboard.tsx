
import React, { useState, useMemo } from 'react';
import { AnalysisResult, SessionData, User, Achievement, LearningPath } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend
} from 'recharts';
import { Trophy, TrendingUp, Calendar, ArrowRight, Video as VideoIcon, FileText, Download, Lock, Medal, Target, Zap, ChevronRight, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  history: SessionData[];
  onStartNew: () => void;
  lastSession: SessionData | null;
  user: User;
  onOpenPricing: () => void;
}

const BADGES: Achievement[] = [
  { id: 'first-step', title: 'First Step', description: 'Complete your first practice session', icon: '🌱', unlocked: false },
  { id: 'confidence-boost', title: 'Confident', description: 'Score > 80% Confidence', icon: '🦁', unlocked: false },
  { id: 'streak-3', title: 'Consistent', description: '3 Day Streak', icon: '🔥', unlocked: false },
  { id: 'pro-member', title: 'Pro League', description: 'Upgrade to Premium', icon: '👑', unlocked: false },
];

const Dashboard: React.FC<DashboardProps> = ({ history, onStartNew, lastSession, user, onOpenPricing }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'progress'>('overview');

  // Resolve achievements
  const myBadges = BADGES.map(b => {
    const isUnlocked = user.achievements?.includes(b.id) || (b.id === 'pro-member' && user.isPremium);
    return { ...b, unlocked: isUnlocked };
  });

  // Calculate Learning Path based on history
  const learningPath: LearningPath = useMemo(() => {
    const recentSessions = history.slice(-5);
    const avgConfidence = recentSessions.reduce((acc, s) => acc + s.averageMetrics.confidence, 0) / (recentSessions.length || 1);
    const avgPace = recentSessions.reduce((acc, s) => acc + (s.averageMetrics.pace === 'Good' ? 100 : 50), 0) / (recentSessions.length || 1);
    
    // Simple Heuristic
    if (avgPace < 80) {
      return {
        week: 1,
        focusArea: 'Pacing & Flow',
        description: 'Your speaking pace fluctuates. Focus on steady, measured delivery this week.',
        tasks: [
          { id: 't1', title: 'Complete "Breathing Basics" scenario', completed: false },
          { id: 't2', title: 'Keep pace "Good" for 2 sessions', completed: false }
        ]
      };
    } else if (avgConfidence < 75) {
      return {
        week: 1,
        focusArea: 'Confidence & Projection',
        description: 'Boost your presence. Work on eye contact and strong opening statements.',
        tasks: [
          { id: 't1', title: 'Complete "Elevator Pitch" twice', completed: false },
          { id: 't2', title: 'Hit 85% Confidence Score', completed: false }
        ]
      };
    } else {
      return {
        week: 2,
        focusArea: 'Advanced Storytelling',
        description: 'Your fundamentals are strong. Time to focus on narrative structure and engagement.',
        tasks: [
          { id: 't1', title: 'Try "Investor Demo" mode', completed: false },
          { id: 't2', title: 'Score 90% in Engagement', completed: false }
        ]
      };
    }
  }, [history]);

  // Chart Data
  const chartData = history.map((h, i) => ({
    name: `S${i + 1}`,
    score: (h.averageMetrics.confidence + h.averageMetrics.clarity + h.averageMetrics.engagement) / 3,
    confidence: h.averageMetrics.confidence,
    clarity: h.averageMetrics.clarity,
    engagement: h.averageMetrics.engagement,
    date: h.date.split('-').slice(1).join('/')
  }));

  const handleExport = () => {
    if (!user.isPremium) {
      onOpenPricing();
    } else {
      alert("Downloading detailed PDF report...");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 pb-20 animate-fade-up">
      
      {/* Header & Streak */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
            Hello, {user.name.split(' ')[0]}
          </h1>
          <p className="text-slate-400">Let's continue your growth journey.</p>
        </div>
        <div className="flex gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-xl text-orange-400">
             <div className="relative">
                <Zap size={20} fill="currentColor" />
                <div className="absolute inset-0 animate-ping opacity-50"><Zap size={20} fill="currentColor" /></div>
             </div>
             <div className="flex flex-col leading-none">
               <span className="font-bold text-lg">{user.streakDays || 0}</span>
               <span className="text-[10px] uppercase font-bold text-orange-400/70">Day Streak</span>
             </div>
          </div>
          <button 
            onClick={onStartNew}
            className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95"
          >
            Start Practice <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10 flex gap-8">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'overview' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Overview
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('progress')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'progress' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Trends & Analytics
          {activeTab === 'progress' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8 animate-fade-in">
          
          {/* Learning Path Card */}
          <div className="glass-panel p-1 rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-purple-600/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-slate-950/40 p-6 md:p-8 rounded-[22px] backdrop-blur-sm flex flex-col md:flex-row gap-8 items-start md:items-center">
               <div className="flex-1">
                  <div className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-widest mb-2">
                    <Target size={14} /> Recommended Learning Path
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{learningPath.focusArea}</h2>
                  <p className="text-slate-400 mb-6 max-w-xl">{learningPath.description}</p>
                  
                  <div className="space-y-3">
                    {learningPath.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-white/5 w-full md:w-fit min-w-[300px]">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                          {task.completed && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                        <span className={`text-sm ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task.title}</span>
                      </div>
                    ))}
                  </div>
               </div>
               
               <div className="w-full md:w-auto flex flex-col gap-3">
                  <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[140px]">
                     <span className="text-slate-500 text-xs font-bold uppercase">Current Level</span>
                     <span className="text-2xl font-bold text-white">Week {learningPath.week}</span>
                  </div>
                  <button className="bg-white text-slate-950 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                    Continue Path <ChevronRight size={16} />
                  </button>
               </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard 
              title="Average Score" 
              value="84.5" 
              trend="+12%" 
              icon={<TrendingUp size={24} />} 
              color="blue" 
            />
            <StatsCard 
              title="Sessions Completed" 
              value={history.length.toString()} 
              icon={<Trophy size={24} />} 
              color="purple" 
            />
             <StatsCard 
              title="Practice Streak" 
              value={`${user.streakDays || 0} Days`} 
              icon={<Calendar size={24} />} 
              color="emerald" 
            />
          </div>

          {/* Recent Session */}
          {lastSession && (
            <div className="glass-panel rounded-3xl p-8 animate-fade-up delay-100">
               <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                       <FileText size={20} className="text-primary-400" /> Latest Analysis
                    </h3>
                    <p className="text-slate-500 text-sm">{lastSession.date} • {lastSession.mode}</p>
                  </div>
                  <button onClick={handleExport} className="text-slate-400 hover:text-white transition-colors">
                    <Download size={20} />
                  </button>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">AI Summary</h4>
                        <p className="text-slate-300 leading-relaxed text-sm">{lastSession.transcriptSummary}</p>
                     </div>
                     <div className="bg-gradient-to-br from-primary-900/30 to-blue-900/30 p-5 rounded-2xl border border-primary-500/10">
                        <h4 className="text-xs font-bold text-primary-400 uppercase mb-2">Action Item</h4>
                        <p className="text-white font-medium italic">"{lastSession.improvementScript}"</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <MetricBox label="Confidence" value={lastSession.averageMetrics.confidence} />
                     <MetricBox label="Clarity" value={lastSession.averageMetrics.clarity} />
                     <MetricBox label="Engagement" value={lastSession.averageMetrics.engagement} />
                     <MetricBox label="Relevance" value={lastSession.averageMetrics.contentRelevance} />
                  </div>
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Detailed Analytics Tab */}
          
          <div className="glass-panel p-8 rounded-3xl border border-white/5 h-96 relative">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 Performance Trends
               </h3>
               {!user.isPremium && (
                  <button onClick={onOpenPricing} className="text-xs font-bold flex items-center gap-1 text-amber-400 bg-amber-900/20 px-3 py-1 rounded-full border border-amber-500/20">
                    <Lock size={12} /> Unlock All History
                  </button>
               )}
             </div>
             <ResponsiveContainer width="100%" height="85%">
               <LineChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                 <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} dy={10} />
                 <YAxis domain={[0, 100]} stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} dx={-10} />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                 />
                 <Legend wrapperStyle={{paddingTop: '20px'}} />
                 <Line type="monotone" name="Confidence" dataKey="confidence" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{ r: 6 }} />
                 <Line type="monotone" name="Clarity" dataKey="clarity" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                 <Line type="monotone" name="Engagement" dataKey="engagement" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} />
               </LineChart>
             </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="glass-panel p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-white mb-4">Achievements</h3>
                <div className="grid grid-cols-2 gap-4">
                  {myBadges.map((badge) => (
                    <div key={badge.id} className={`p-3 rounded-xl border flex items-center gap-3 ${
                      badge.unlocked 
                        ? 'bg-slate-800/50 border-slate-700' 
                        : 'bg-slate-900/30 border-slate-800 opacity-50 grayscale'
                    }`}>
                       <div className="text-2xl">{badge.icon}</div>
                       <div className="overflow-hidden">
                         <h4 className="font-bold text-sm text-white truncate">{badge.title}</h4>
                         <p className="text-[10px] text-slate-500 truncate">{badge.description}</p>
                       </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="glass-panel p-6 rounded-3xl flex flex-col justify-center items-center text-center space-y-4 border border-dashed border-slate-700">
                <div className="bg-slate-800 p-4 rounded-full">
                  <Calendar size={32} className="text-slate-400" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white">Compare Sessions</h3>
                   <p className="text-sm text-slate-400 max-w-xs mx-auto">Compare your best take against your baseline to see how much you've improved.</p>
                </div>
                <button className="text-primary-400 font-bold text-sm hover:text-primary-300" disabled={!user.isPremium} onClick={onOpenPricing}>
                   {user.isPremium ? 'Select Sessions' : 'Upgrade to Compare'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponents for cleaner code
const StatsCard = ({ title, value, trend, icon, color }: any) => {
  const colorMap: any = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  };
  const theme = colorMap[color];

  return (
    <div className="glass-panel p-6 rounded-3xl hover:bg-slate-800/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${theme.bg} ${theme.text} ${theme.border} border`}>
          {icon}
        </div>
        {trend && <span className="text-green-400 text-sm font-bold bg-green-500/10 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
      <p className="text-4xl font-bold text-white mt-1">{value}</p>
    </div>
  );
};

const MetricBox = ({ label, value }: { label: string, value: number }) => (
  <div className="bg-slate-900/50 p-4 rounded-2xl text-center border border-white/5">
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">{label}</div>
  </div>
);

export default Dashboard;
