
import React, { useState } from 'react';
import ModeSelection from './components/ModeSelection';
import LiveSession from './components/LiveSession';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import PricingModal from './components/PricingModal';
import { SessionMode, AnalysisResult, SessionData, User } from './types';
import { generatePostSessionSummary } from './services/geminiService';
import { LayoutDashboard, LogOut, User as UserIcon, Crown } from 'lucide-react';

// Mock history for initial load
const MOCK_HISTORY: SessionData[] = [
  {
    id: '1',
    mode: SessionMode.SALES_PITCH,
    date: '2023-10-15',
    durationSeconds: 120,
    averageMetrics: { confidence: 65, clarity: 70, engagement: 60, contentRelevance: 80, pace: 'Good', fillerWordCount: 5 },
    transcriptSummary: 'Good start but lacked energy in the middle.',
    improvementScript: 'Focus on breathing.',
    transcript: "Hello everyone, today I'd like to..."
  },
  {
    id: '2',
    mode: SessionMode.SALES_PITCH,
    date: '2023-10-16',
    durationSeconds: 140,
    averageMetrics: { confidence: 72, clarity: 75, engagement: 68, contentRelevance: 85, pace: 'Good', fillerWordCount: 2 },
    transcriptSummary: 'Better pacing today.',
    improvementScript: 'Try pausing after key points.',
    transcript: "Thanks for joining. The product I want to share is..."
  },
  {
    id: '3',
    mode: SessionMode.PRESENTATION,
    date: '2023-10-18',
    durationSeconds: 300,
    averageMetrics: { confidence: 80, clarity: 82, engagement: 78, contentRelevance: 88, pace: 'Good', fillerWordCount: 0 },
    transcriptSummary: 'Excellent structure and eye contact.',
    improvementScript: 'Work on hand gestures next.',
    transcript: "Welcome to the quarterly review. As you can see..."
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('coachflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Views within the App (when logged in)
  const [view, setView] = useState<'home' | 'live' | 'dashboard'>('home');
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionData[]>(MOCK_HISTORY);
  const [lastSession, setLastSession] = useState<SessionData | null>(MOCK_HISTORY[2]);
  const [isProcessingEnd, setIsProcessingEnd] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  // Auth Views (when logged out)
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem('coachflow_user', JSON.stringify(authenticatedUser));
    setView('home');
    setAuthView('landing'); // Reset for next logout
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('coachflow_user');
    setView('home');
    setSelectedMode(null);
    setAuthView('landing');
  };

  const handleStartSession = (mode: SessionMode) => {
    setSelectedMode(mode);
    setView('live');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('coachflow_user', JSON.stringify(updatedUser));
    
    // Update DB
    try {
      const storedUsers = localStorage.getItem('coachflow_db_users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const index = users.findIndex((u: User) => u.id === user.id);
        if (index !== -1) {
          users[index] = { ...users[index], ...updates };
          localStorage.setItem('coachflow_db_users', JSON.stringify(users));
        }
      }
    } catch (e) {
      console.error("DB update failed", e);
    }
  };

  const handleUpgradeUser = () => {
    updateUser({ isPremium: true });
    setShowPricing(false);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // remove "data:video/webm;base64," header
        resolve(result.split(',')[1]); 
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleEndSession = async (metrics: AnalysisResult[], recordedBlob?: Blob) => {
    setIsProcessingEnd(true);
    // Calculate averages
    const total = metrics.length || 1;
    const sums = metrics.reduce((acc, curr) => ({
      confidence: acc.confidence + curr.metrics.confidence,
      clarity: acc.clarity + curr.metrics.clarity,
      engagement: acc.engagement + curr.metrics.engagement,
      contentRelevance: acc.contentRelevance + curr.metrics.contentRelevance,
    }), { confidence: 0, clarity: 0, engagement: 0, contentRelevance: 0 });

    const avgMetrics = {
      confidence: Math.round(sums.confidence / total),
      clarity: Math.round(sums.clarity / total),
      engagement: Math.round(sums.engagement / total),
      contentRelevance: Math.round(sums.contentRelevance / total),
      pace: metrics.length > 0 ? metrics[metrics.length - 1].metrics.pace : 'Good',
      fillerWordCount: metrics.reduce((acc, curr) => acc + (curr.metrics.fillerWordCount || 0), 0)
    };

    const duration = metrics.length * 4; // Approx duration based on interval
    
    // Prepare Video & Summary
    let videoUrl = undefined;
    let base64Audio = undefined;

    if (recordedBlob) {
      videoUrl = URL.createObjectURL(recordedBlob);
      try {
        base64Audio = await blobToBase64(recordedBlob);
      } catch (e) {
        console.error("Failed to convert blob", e);
      }
    }

    let summaryData: { summary: string; script: string; transcript?: string } = { 
      summary: "Session recorded.", 
      script: "Practice again.", 
      transcript: "" 
    };
    
    try {
      summaryData = await generatePostSessionSummary(selectedMode!, duration, base64Audio);
    } catch (e) {
      console.error("Summary generation failed", e);
    }

    const newSession: SessionData = {
      id: Date.now().toString(),
      mode: selectedMode!,
      date: new Date().toISOString().split('T')[0],
      durationSeconds: duration,
      averageMetrics: avgMetrics,
      transcriptSummary: summaryData.summary,
      improvementScript: summaryData.script,
      transcript: summaryData.transcript,
      videoUrl: videoUrl
    };

    setSessionHistory(prev => [...prev, newSession]);
    setLastSession(newSession);
    
    // Check Achievements
    const newBadges = [...(user?.achievements || [])];
    if (!newBadges.includes('first-step')) newBadges.push('first-step');
    if (avgMetrics.confidence > 80 && !newBadges.includes('confidence-boost')) newBadges.push('confidence-boost');
    // Simple streak logic could go here
    
    if (user && newBadges.length > (user.achievements?.length || 0)) {
       updateUser({ achievements: newBadges });
    }

    setView('dashboard');
    setIsProcessingEnd(false);
  };

  // If user is not logged in, show Landing or Auth pages
  if (!user) {
    if (authView === 'landing') {
      return (
        <LandingPage 
          onLogin={() => setAuthView('login')} 
          onSignup={() => setAuthView('signup')} 
        />
      );
    }
    return (
      <Auth 
        key={authView} // Force re-render to switch modes
        onLogin={handleLogin} 
        initialView={authView} 
        onBack={() => setAuthView('landing')} 
      />
    );
  }

  // Logged In App Layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <PricingModal 
        isOpen={showPricing} 
        onClose={() => setShowPricing(false)} 
        onUpgrade={handleUpgradeUser} 
      />

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white cursor-pointer" onClick={() => setView('home')}>
            <span className="bg-primary-600 w-8 h-8 rounded-lg flex items-center justify-center">C</span>
            CoachFlow
          </div>
          
          <div className="flex items-center gap-6">
            {/* Navigation Links */}
            <div className="flex items-center gap-2">
               {view !== 'home' && (
                 <button 
                  onClick={() => setView('dashboard')} 
                  title="Dashboard"
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                    <LayoutDashboard size={20} />
                 </button>
               )}
               {view === 'live' && (
                  <button onClick={() => setView('home')} className="text-red-400 hover:text-red-300 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors">
                     Cancel
                  </button>
               )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-white">{user.name}</span>
                {user.isPremium ? (
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wide flex items-center gap-1">
                    <Crown size={10} fill="currentColor" /> Pro Member
                  </span>
                ) : (
                  <button 
                    onClick={() => setShowPricing(true)}
                    className="text-xs text-slate-400 hover:text-primary-400 underline decoration-dotted underline-offset-2"
                  >
                    Upgrade to Pro
                  </button>
                )}
              </div>
              <div className="relative group">
                {user.avatarUrl ? (
                   <img 
                    src={user.avatarUrl} 
                    alt={user.name}
                    className={`w-9 h-9 rounded-full object-cover border ${user.isPremium ? 'border-amber-500/50' : 'border-slate-700'}`}
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${user.isPremium ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    <UserIcon size={18} />
                  </div>
                )}
              </div>
              <button 
                onClick={handleLogout}
                title="Sign Out"
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-0">
        {view === 'home' && (
          <ModeSelection 
            onSelect={handleStartSession} 
            isPremium={user.isPremium} 
            onOpenPricing={() => setShowPricing(true)}
          />
        )}
        
        {view === 'live' && selectedMode && (
          isProcessingEnd ? (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
               <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-xl font-medium animate-pulse">Generating your personalized improvement plan...</p>
            </div>
          ) : (
            <LiveSession mode={selectedMode} onEndSession={handleEndSession} />
          )
        )}
        
        {view === 'dashboard' && (
          <Dashboard 
            history={sessionHistory} 
            lastSession={lastSession}
            onStartNew={() => setView('home')} 
            user={user}
            onOpenPricing={() => setShowPricing(true)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
