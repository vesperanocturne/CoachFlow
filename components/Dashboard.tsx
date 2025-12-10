import React, { useState, useMemo } from 'react';
import { SessionData, User, Achievement, LearningPath, SessionMode } from '../types';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Trophy, TrendingUp, Calendar, ArrowRight, FileText, Download, Lock, Target, Zap, ChevronRight, CheckCircle2, Split, Star, ArrowLeft, History, Search, Clock } from 'lucide-react';

interface DashboardProps {
  history: SessionData[];
  onStartNew: () => void;
  lastSession: SessionData | null;
  user: User;
  onOpenPricing: () => void;
  onSessionUpdate: (id: string, updates: Partial<SessionData>) => void;
}

const BADGES: Achievement[] = [
  { id: 'first-step', title: 'First Step', description: 'Complete your first practice session', icon: '🌱', unlocked: false },
  { id: 'confidence-boost', title: 'Confident', description: 'Score > 80% Confidence', icon: '🦁', unlocked: false },
  { id: 'streak-3', title: 'Consistent', description: '3 Day Streak', icon: '🔥', unlocked: false },
  { id: 'pro-member', title: 'Pro League', description: 'Upgrade to Premium', icon: '👑', unlocked: false },
];

const Dashboard: React.FC<DashboardProps> = ({ history, onStartNew, lastSession, user, onOpenPricing, onSessionUpdate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'compare' | 'history'>('overview');
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Resolve achievements
  const myBadges = BADGES.map(b => {
    const isUnlocked = user.achievements?.includes(b.id) || (b.id === 'pro-member' && user.isPremium);
    return { ...b, unlocked: isUnlocked };
  });

  const toggleComparisonSelect = (id: string) => {
    if (comparisonIds.includes(id)) {
      setComparisonIds(prev => prev.filter(c => c !== id));
    } else {
      if (comparisonIds.length < 2) {
        setComparisonIds(prev => [...prev, id]);
      }
    }
  };

  const markBestTake = (sessionId: string) => {
    const label = prompt("Enter a label for this best take (e.g. 'Q4 Review Prep'):", "Top Performance");
    if (label) {
      onSessionUpdate(sessionId, { bestTakeLabel: label });
    }
  };

  // --- Dynamic Stats Calculation ---
  const totalSessions = history.length;

  const averageScore = useMemo(() => {
    if (totalSessions === 0) return 0;
    const sum = history.reduce((acc, session) => {
      const s = session.averageMetrics;
      if (!s) return acc;
      // Average of the 4 main metrics
      const sessionAvg = (s.confidence + s.clarity + s.engagement + s.contentRelevance) / 4;
      return acc + sessionAvg;
    }, 0);
    return Math.round(sum / totalSessions);
  }, [history, totalSessions]);

  const scoreTrend = useMemo(() => {
    if (totalSessions < 2) return null;
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    
    // Safety check if prev exists
    if (!prev) return null;

    const getScore = (s: SessionData) => {
        if (!s?.averageMetrics) return 0;
        return (s.averageMetrics.confidence + s.averageMetrics.clarity + s.averageMetrics.engagement + s.averageMetrics.contentRelevance) / 4;
    };
    
    const diff = getScore(last) - getScore(prev);
    const sign = diff > 0 ? '+' : '';
    return `${sign}${Math.round(diff)}%`;
  }, [history, totalSessions]);


  // Calculate Learning Path based on history
  const learningPath: LearningPath = useMemo(() => {
    // 1. Onboarding Path (Less than 3 sessions)
    if (history.length < 3) {
      return {
        week: 1,
        focusArea: 'Getting Started',
        description: 'Complete 3 sessions to unlock your personalized AI learning path.',
        tasks: [
          { id: 'onb-1', title: 'Complete your first session', completed: history.length > 0 },
          { id: 'onb-2', title: 'Try "Sales Pitch" mode', completed: history.some(s => s.mode === SessionMode.SALES_PITCH) },
          { id: 'onb-3', title: 'Reach 3 total sessions', completed: false }
        ]
      };
    }

    const recentSessions = history.slice(-5);
    const len = recentSessions.length || 1;
    
    // Calculate Averages for Logic safely using optional chaining
    // This prevents crash if averageMetrics is missing on a session object
    const avgConfidence = recentSessions.reduce((acc, s) => acc + (s.averageMetrics?.confidence || 0), 0) / len;
    const avgClarity = recentSessions.reduce((acc, s) => acc + (s.averageMetrics?.clarity || 0), 0) / len;
    const avgEngagement = recentSessions.reduce((acc, s) => acc + (s.averageMetrics?.engagement || 0), 0) / len;
    const totalFillerWords = recentSessions.reduce((acc, s) => acc + (s.averageMetrics?.fillerWordCount || 0), 0);
    const avgFillerWordsPerSession = totalFillerWords / len;
    
    // Pace score: 0 for bad (Too Fast/Slow), 1 for good
    const paceScore = recentSessions.reduce((acc, s) => acc + (s.averageMetrics?.pace === 'Good' ? 1 : 0), 0) / len;

    const currentWeek = Math.ceil(history.length / 5);

    // Logic Tree for Personalized Path
    // Priority 1: Speech Hygiene (Pace & Filler Words)
    if (paceScore < 0.6 || avgFillerWordsPerSession > 5) {
      return {
        week: currentWeek,
        focusArea: 'Pacing & Fluency',
        description: 'Your speech flow is interrupted by speed issues or filler words. Let\'s smooth it out.',
        tasks: [
          { id: 't-pace-1', title: 'Practice "60s Elevator Pitch" focusing on pauses', completed: false },
          { id: 't-pace-2', title: 'Achieve "Good" pace in 2 consecutive sessions', completed: false },
          { id: 't-fill-1', title: `Keep filler words under 3 (Avg: ${Math.round(avgFillerWordsPerSession)})`, completed: false }
        ]
      };
    }

    // Priority 2: Clarity & Articulation
    if (avgClarity < 75) {
      return {
        week: currentWeek,
        focusArea: 'Clarity & Articulation',
        description: 'Your message is getting lost. Focus on enunciation and concise sentences.',
        tasks: [
          { id: 't-clar-1', title: 'Complete "Tough Interview Question" scenario', completed: false },
          { id: 't-clar-2', title: 'Score > 80% Clarity in Public Speaking mode', completed: false },
          { id: 't-clar-3', title: 'Review transcript for long sentences', completed: false }
        ]
      };
    }

    // Priority 3: Confidence & Presence
    if (avgConfidence < 75) {
      return {
        week: currentWeek,
        focusArea: 'Confidence & Projection',
        description: 'You have great content, but need more authority. Work on eye contact and steady tone.',
        tasks: [
          { id: 't-conf-1', title: 'Maintain eye contact > 80% of session', completed: false },
          { id: 't-conf-2', title: 'Complete "Investor Demo" scenario', completed: false },
          { id: 't-conf-3', title: 'Hit 85% Confidence Score', completed: false }
        ]
      };
    }

    // Priority 4: Engagement (Advanced)
    if (avgEngagement < 80) {
      return {
        week: currentWeek,
        focusArea: 'Audience Engagement',
        description: 'You are clear and confident. Now, make them care. Use vocal variety and expressions.',
        tasks: [
          { id: 't-eng-1', title: 'Vary your pitch/tone in next session', completed: false },
          { id: 't-eng-2', title: 'Score > 90% Engagement', completed: false },
          { id: 't-eng-3', title: 'Try a storytelling approach', completed: false }
        ]
      };
    }

    // Mastery Path
    return {
      week: currentWeek,
      focusArea: 'Mastery & Maintenance',
      description: 'Your metrics are excellent. Challenge yourself with complex scenarios.',
      tasks: [
        { id: 't-mast-1', title: 'Complete "VC Rapid Fire Q&A" scenario', completed: false },
        { id: 't-mast-2', title: 'Maintain > 90% average across all metrics', completed: false },
        { id: 't-mast-3', title: 'Record a 5-minute presentation', completed: false }
      ]
    };

  }, [history]);

  // Chart Data
  const chartData = history.map((h, i) => {
    const m = h.averageMetrics || { confidence: 0, clarity: 0, engagement: 0, contentRelevance: 0 };
    return {
      name: `S${i + 1}`,
      score: (m.confidence + m.clarity + m.engagement) / 3,
      confidence: m.confidence,
      clarity: m.clarity,
      engagement: m.engagement,
      date: h.date.split('-').slice(1).join('/')
    };
  });

  const handleExport = () => {
    if (!user.isPremium) {
      onOpenPricing();
    } else {
      alert("Downloading detailed PDF report...");
    }
  };

  // Compare Logic
  const sessionA = history.find(s => s.id === comparisonIds[0]);
  const sessionB = history.find(s => s.id === comparisonIds[1]);

  // Ensure both sessions have metrics before rendering chart
  const radarComparisonData = sessionA && sessionB && sessionA.averageMetrics && sessionB.averageMetrics ? [
    { subject: 'Confidence', A: sessionA.averageMetrics.confidence, B: sessionB.averageMetrics.confidence, fullMark: 100 },
    { subject: 'Clarity', A: sessionA.averageMetrics.clarity, B: sessionB.averageMetrics.clarity, fullMark: 100 },
    { subject: 'Engagement', A: sessionA.averageMetrics.engagement, B: sessionB.averageMetrics.engagement, fullMark: 100 },
    { subject: 'Relevance', A: sessionA.averageMetrics.contentRelevance, B: sessionB.averageMetrics.contentRelevance, fullMark: 100 },
  ] : [];

  // Filtered history
  const filteredHistory = history.filter(s => 
    s.mode.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.transcriptSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.date.includes(searchQuery)
  ).slice().reverse();

  // Helper to render session details (used in Overview and History)
  const renderSessionDetail = (session: SessionData) => {
    // Guard clause: if session or metrics missing, do not render details to prevent crash
    if (!session || !session.averageMetrics) return null;
    
    return (
      <div className="glass-panel rounded-3xl p-8 animate-fade-in">
         <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <FileText size={20} className="text-primary-400" /> Session Analysis
              </h3>
              <p className="text-slate-500 text-sm">{session.date} • {session.mode}</p>
            </div>
            <div className="flex gap-2">
              {session.bestTakeLabel && (
                  <div className="bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/20 flex items-center gap-1 text-sm font-bold">
                    <Star size={14} fill="currentColor" /> {session.bestTakeLabel}
                  </div>
              )}
              <button onClick={handleExport} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                <Download size={18} />
              </button>
            </div>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">AI Summary</h4>
                  <p className="text-slate-300 leading-relaxed text-sm">{session.transcriptSummary}</p>
               </div>
               <div className="bg-gradient-to-br from-primary-900/30 to-blue-900/30 p-5 rounded-2xl border border-primary-500/10">
                  <h4 className="text-xs font-bold text-primary-400 uppercase mb-2">Action Item</h4>
                  <p className="text-white font-medium italic">"{session.improvementScript}"</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <MetricBox label="Confidence" value={session.averageMetrics.confidence} />
               <MetricBox label="Clarity" value={session.averageMetrics.clarity} />
               <MetricBox label="Engagement" value={session.averageMetrics.engagement} />
               <MetricBox label="Relevance" value={session.averageMetrics.contentRelevance} />
            </div>
         </div>
  
         {session.transcript && (
            <div className="mt-8 pt-8 border-t border-white/5">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Transcript</h4>
              <div className="bg-slate-950/50 p-6 rounded-2xl text-slate-400 text-sm leading-relaxed max-h-60 overflow-y-auto custom-scrollbar border border-white/5">
                {session.transcript}
              </div>
            </div>
         )}
      </div>
    );
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
      <div className="border-b border-white/10 flex gap-8 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'overview' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Overview
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('progress')}
          className={`pb-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'progress' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Trends & Analytics
          {activeTab === 'progress' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-4 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'history' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <History size={14} /> Full History
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('compare')}
          className={`pb-4 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'compare' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Split size={14} /> Compare Sessions
          {activeTab === 'compare' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'overview' && (
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
                  <button onClick={onStartNew} className="bg-white text-slate-950 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                    Continue Path <ChevronRight size={16} />
                  </button>
               </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard 
              title="Average Score" 
              value={averageScore > 0 ? averageScore.toString() : "-"} 
              trend={scoreTrend} 
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
          {lastSession && renderSessionDetail(lastSession)}
        </div>
      )}

      {activeTab === 'progress' && (
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
                  <Split size={32} className="text-slate-400" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white">Compare Sessions</h3>
                   <p className="text-sm text-slate-400 max-w-xs mx-auto">Compare your best take against your baseline.</p>
                </div>
                <button 
                  className="text-primary-400 font-bold text-sm hover:text-primary-300" 
                  onClick={() => setActiveTab('compare')}
                >
                  Go to Compare
                </button>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6 animate-fade-in">
          {selectedHistoryId ? (
            <div className="space-y-4">
               <button 
                  onClick={() => setSelectedHistoryId(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} /> Back to History
                </button>
               {renderSessionDetail(history.find(s => s.id === selectedHistoryId)!)}
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   <History size={20} className="text-primary-400" /> Session History
                </h2>
                <div className="relative w-full md:w-64">
                   <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                   <input 
                    type="text" 
                    placeholder="Search sessions..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary-500"
                   />
                </div>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-900/50 text-xs uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Mode</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Avg Score</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredHistory.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => setSelectedHistoryId(session.id)}>
                        <td className="px-6 py-4 font-medium text-white">{session.date}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">{session.mode}</span>
                        </td>
                        <td className="px-6 py-4 flex items-center gap-2">
                           <Clock size={14} /> {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                               <div className="h-full bg-primary-500" style={{ width: `${((session.averageMetrics?.confidence || 0) + (session.averageMetrics?.clarity || 0) + (session.averageMetrics?.engagement || 0)) / 3}%`}}></div>
                             </div>
                             <span className="text-xs font-bold text-white">{Math.round(((session.averageMetrics?.confidence || 0) + (session.averageMetrics?.clarity || 0) + (session.averageMetrics?.engagement || 0)) / 3)}%</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="text-primary-400 hover:text-white font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                             View Details
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredHistory.length === 0 && (
                  <div className="p-12 text-center text-slate-500">
                    No sessions found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="space-y-6 animate-fade-in">
          {sessionA && sessionB && comparisonIds.length === 2 ? (
            // --- COMPARISON VIEW ---
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setComparisonIds([])}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} /> Back to Selection
                </button>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   <Split size={20} className="text-primary-400" /> Session Comparison
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Radar Overlay */}
                <div className="glass-panel p-6 rounded-3xl h-80 relative flex flex-col items-center justify-center col-span-1 lg:col-span-2">
                   <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Metrics Overlay</h3>
                   <div className="w-full h-full max-w-lg">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarComparisonData}>
                          <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Session A" dataKey="A" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.1} />
                          <Radar name="Session B" dataKey="B" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.1} />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Session A Column */}
                <div className="space-y-4">
                  <ComparisonHeader 
                     session={sessionA} 
                     color="blue" 
                     label="Session A" 
                     onMarkBest={() => markBestTake(sessionA.id)}
                  />
                  <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-blue-500 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <MetricBox label="Confidence" value={sessionA.averageMetrics.confidence} />
                        <MetricBox label="Clarity" value={sessionA.averageMetrics.clarity} />
                     </div>
                     <div className="p-4 bg-slate-900/50 rounded-xl">
                       <h4 className="text-xs text-blue-400 font-bold uppercase mb-2">Summary</h4>
                       <p className="text-sm text-slate-300">{sessionA.transcriptSummary}</p>
                     </div>
                  </div>
                </div>

                {/* Session B Column */}
                <div className="space-y-4">
                  <ComparisonHeader 
                    session={sessionB} 
                    color="purple" 
                    label="Session B" 
                    onMarkBest={() => markBestTake(sessionB.id)}
                  />
                  <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-purple-500 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <MetricBox label="Confidence" value={sessionB.averageMetrics.confidence} />
                        <MetricBox label="Clarity" value={sessionB.averageMetrics.clarity} />
                     </div>
                     <div className="p-4 bg-slate-900/50 rounded-xl">
                       <h4 className="text-xs text-purple-400 font-bold uppercase mb-2">Summary</h4>
                       <p className="text-sm text-slate-300">{sessionB.transcriptSummary}</p>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // --- SELECTION VIEW ---
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Select 2 Sessions to Compare</h2>
                <p className="text-slate-400">
                  {comparisonIds.length} / 2 Selected
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.slice().reverse().map((session) => {
                  const isSelected = comparisonIds.includes(session.id);
                  return (
                    <button
                      key={session.id}
                      onClick={() => toggleComparisonSelect(session.id)}
                      disabled={!isSelected && comparisonIds.length >= 2}
                      className={`relative text-left p-5 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-primary-900/20 border-primary-500 ring-2 ring-primary-500/20' 
                          : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                      } ${!isSelected && comparisonIds.length >= 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">{session.mode}</span>
                        {isSelected && <CheckCircle2 size={18} className="text-primary-400" />}
                      </div>
                      <div className="text-white font-bold mb-1">{session.date}</div>
                      {session.bestTakeLabel && (
                        <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/20 mt-2">
                          <Star size={10} fill="currentColor" /> {session.bestTakeLabel}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
  const theme = colorMap[color] || colorMap.blue;

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

const ComparisonHeader = ({ session, color, label, onMarkBest }: { session: SessionData, color: string, label: string, onMarkBest: () => void }) => (
  <div className="flex items-center justify-between">
    <div>
      <h3 className={`font-bold uppercase tracking-wider text-${color}-400 text-sm mb-1`}>{label}</h3>
      <p className="text-white font-medium">{session.date}</p>
      {session.bestTakeLabel && (
        <span className="text-amber-400 text-xs font-bold flex items-center gap-1 mt-1">
          <Star size={10} fill="currentColor" /> {session.bestTakeLabel}
        </span>
      )}
    </div>
    <button 
      onClick={onMarkBest}
      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
    >
      <Star size={12} /> Mark Best
    </button>
  </div>
);

export default Dashboard;