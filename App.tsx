import React, { useState, useEffect, useCallback } from 'react';
import ModeSelection from './components/ModeSelection';
import LiveSession from './components/LiveSession';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import PricingModal from './components/PricingModal';
import SettingsModal from './components/SettingsModal';
import UserProfile from './components/UserProfile';
import { ToastContainer } from './components/Toast';
import { SessionMode, AnalysisResult, SessionData, User, Scenario, ShortcutDef, ToastMessage } from './types';
import { generatePostSessionSummary } from './services/geminiService';
import { LayoutDashboard, LogOut, User as UserIcon, Crown, Settings as SettingsIcon, Zap, CheckCircle2 } from 'lucide-react';

const DEFAULT_SHORTCUTS: ShortcutDef[] = [
  { action: 'START_STOP_SESSION', key: 'R', ctrlKey: false, altKey: true },
  { action: 'TOGGLE_METRICS', key: 'M', ctrlKey: true },
  { action: 'NAV_HOME', key: 'H', altKey: true },
  { action: 'NAV_DASHBOARD', key: 'D', altKey: true },
  { action: 'OPEN_SETTINGS', key: 'S', altKey: true }
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
  const [view, setView] = useState<'home' | 'live' | 'dashboard' | 'profile'>('home');
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | undefined>(undefined);
  
  // Initialize history as empty array. It will be populated from localStorage in useEffect.
  const [sessionHistory, setSessionHistory] = useState<SessionData[]>([]);
  const [lastSession, setLastSession] = useState<SessionData | null>(null);
  
  const [isProcessingEnd, setIsProcessingEnd] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Auth Views (when logged out)
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Shortcuts State
  const [shortcuts, setShortcuts] = useState<ShortcutDef[]>(() => {
    try {
      const saved = localStorage.getItem('coachflow_shortcuts');
      return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
    } catch {
      return DEFAULT_SHORTCUTS;
    }
  });

  // Load User Session History
  useEffect(() => {
    if (user) {
      try {
        const savedSessions = localStorage.getItem(`coachflow_sessions_${user.id}`);
        if (savedSessions) {
          const parsed = JSON.parse(savedSessions);
          // Filter out sessions that don't have the required structure to prevent crashes
          const validSessions = Array.isArray(parsed) 
            ? parsed.filter((s: any) => s && s.averageMetrics && typeof s.averageMetrics.confidence === 'number') 
            : [];
          
          setSessionHistory(validSessions);
          setLastSession(validSessions.length > 0 ? validSessions[validSessions.length - 1] : null);
        } else {
          // New user or no history found -> Empty state
          setSessionHistory([]);
          setLastSession(null);
        }
      } catch (e) {
        console.error("Failed to load session history", e);
        setSessionHistory([]);
      }
    } else {
      setSessionHistory([]);
      setLastSession(null);
    }
  }, [user]);

  const saveShortcuts = (newShortcuts: ShortcutDef[]) => {
    setShortcuts(newShortcuts);
    localStorage.setItem('coachflow_shortcuts', JSON.stringify(newShortcuts));
    addToast('success', 'Keyboard shortcuts saved');
  };

  const resetShortcuts = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
    localStorage.setItem('coachflow_shortcuts', JSON.stringify(DEFAULT_SHORTCUTS));
    addToast('info', 'Shortcuts reset to defaults');
  };

  // Helper to check if a keyboard event matches a shortcut definition
  const checkShortcut = useCallback((e: KeyboardEvent, action: string) => {
    const def = shortcuts.find(s => s.action === action);
    if (!def) return false;
    
    // Normalize keys (e.key can be 'r' or 'R')
    const eventKey = e.key.toUpperCase();
    const defKey = def.key.toUpperCase();
    
    return (
      eventKey === defKey &&
      e.ctrlKey === !!def.ctrlKey &&
      e.altKey === !!def.altKey &&
      e.shiftKey === !!def.shiftKey &&
      e.metaKey === !!def.metaKey
    );
  }, [shortcuts]);

  // Global Key Listener
  useEffect(() => {
    if (!user) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (checkShortcut(e, 'NAV_HOME')) {
        e.preventDefault();
        setView('home');
      } else if (checkShortcut(e, 'NAV_DASHBOARD')) {
        e.preventDefault();
        setView('dashboard');
      } else if (checkShortcut(e, 'OPEN_SETTINGS')) {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [user, checkShortcut]);


  // Calculate Streak Logic Helper
  const calculateStreak = (lastDateStr?: string, currentStreak: number = 0): number => {
    if (!lastDateStr) return 0;
    const last = new Date(lastDateStr);
    const today = new Date();
    // Reset hours to compare dates only
    last.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const diffTime = Math.abs(today.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays === 0) return currentStreak; // Already practiced today
    if (diffDays === 1) return currentStreak + 1; // Consecutive day
    return 0; // Streak broken
  };

  const handleLogin = (authenticatedUser: User) => {
    // Recalculate streak on login just in case
    const updatedUser = { ...authenticatedUser, streakDays: calculateStreak(authenticatedUser.lastPracticeDate, authenticatedUser.streakDays) };
    setUser(updatedUser);
    localStorage.setItem('coachflow_user', JSON.stringify(updatedUser));
    setView('home');
    setAuthView('landing'); 
    addToast('success', `Welcome back, ${updatedUser.name.split(' ')[0]}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('coachflow_user');
    setView('home');
    setSelectedMode(null);
    setSelectedScenario(undefined);
    setAuthView('landing');
    addToast('info', 'Logged out successfully');
  };

  const handleStartSession = (mode: SessionMode) => {
    setSelectedMode(mode);
    setSelectedScenario(undefined); // Reset scenario if mode selected manually
    setView('live');
  };

  const handleStartScenario = (scenario: Scenario) => {
    setSelectedMode(scenario.mode);
    setSelectedScenario(scenario);
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
    addToast('success', 'Welcome to CoachFlow Pro!');
  };

  // Helper to persist history changes
  const saveHistory = (newHistory: SessionData[]) => {
    if (user) {
      localStorage.setItem(`coachflow_sessions_${user.id}`, JSON.stringify(newHistory));
    }
  };

  const handleSessionUpdate = (id: string, updates: Partial<SessionData>) => {
    const updatedHistory = sessionHistory.map(s => s.id === id ? { ...s, ...updates } : s);
    setSessionHistory(updatedHistory);
    saveHistory(updatedHistory);
    
    if (lastSession?.id === id) {
      setLastSession(prev => prev ? { ...prev, ...updates } : null);
    }
    addToast('success', 'Session updated');
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
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

    const duration = metrics.length * 4; 
    
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
      addToast('error', 'Failed to generate advanced summary');
    }

    const newSession: SessionData = {
      id: Date.now().toString(),
      mode: selectedMode!,
      scenarioId: selectedScenario?.id,
      date: new Date().toISOString().split('T')[0],
      durationSeconds: duration,
      averageMetrics: avgMetrics,
      transcriptSummary: summaryData.summary,
      improvementScript: summaryData.script,
      transcript: summaryData.transcript,
      videoUrl: videoUrl
    };

    const updatedHistory = [...sessionHistory, newSession];
    setSessionHistory(updatedHistory);
    setLastSession(newSession);
    saveHistory(updatedHistory);
    
    // Update User Stats (Streak, Last Practice, Achievements)
    if (user) {
       const todayStr = new Date().toISOString();
       // Only increment streak if this is the first practice of a NEW day
       const isNewDay = !user.lastPracticeDate || new Date(user.lastPracticeDate).getDate() !== new Date().getDate();
       const newStreak = isNewDay ? (user.streakDays || 0) + 1 : (user.streakDays || 1);

       const newBadges = [...(user.achievements || [])];
       if (!newBadges.includes('first-step')) newBadges.push('first-step');
       if (avgMetrics.confidence > 80 && !newBadges.includes('confidence-boost')) newBadges.push('confidence-boost');
       if (newStreak >= 3 && !newBadges.includes('streak-3')) newBadges.push('streak-3');
       
       updateUser({ 
         achievements: newBadges,
         streakDays: newStreak,
         lastPracticeDate: todayStr
       });
    }

    setView('dashboard');
    setIsProcessingEnd(false);
    addToast('success', 'Session analysis complete!');
  };

  const getTooltipText = (action: string) => {
    const s = shortcuts.find(s => s.action === action);
    if (!s) return "";
    const parts = [];
    if (s.metaKey) parts.push('Cmd');
    if (s.ctrlKey) parts.push('Ctrl');
    if (s.altKey) parts.push('Alt');
    if (s.shiftKey) parts.push('Shift');
    parts.push(s.key === ' ' ? 'Space' : s.key);
    return `(${parts.join('+')})`;
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
      <div className="relative">
        <Auth 
          key={authView} 
          onLogin={handleLogin} 
          initialView={authView} 
          onBack={() => setAuthView('landing')}
          addToast={addToast}
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <PricingModal 
        isOpen={showPricing} 
        onClose={() => setShowPricing(false)} 
        onUpgrade={handleUpgradeUser} 
      />
      
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        shortcuts={shortcuts}
        onUpdateShortcuts={saveShortcuts}
        onResetShortcuts={resetShortcuts}
      />

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white cursor-pointer group" onClick={() => setView('home')}>
            <span className="bg-gradient-to-tr from-primary-600 to-primary-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">C</span>
            CoachFlow
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               {view !== 'home' && view !== 'profile' && (
                 <button 
                  onClick={() => setView('dashboard')} 
                  title={`Dashboard ${getTooltipText('NAV_DASHBOARD')}`}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                    <LayoutDashboard size={20} />
                 </button>
               )}
               {view === 'live' && (
                  <button onClick={() => setView('home')} className="text-red-400 hover:text-red-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors">
                     Exit Session
                  </button>
               )}
            </div>

            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-white">{user.name}</span>
                {user.isPremium ? (
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wide flex items-center gap-1">
                    <Crown size={10} fill="currentColor" /> Pro Member
                  </span>
                ) : (
                  <button 
                    onClick={() => setShowPricing(true)}
                    className="text-xs text-slate-400 hover:text-primary-400 hover:underline decoration-dotted underline-offset-2 transition-colors"
                  >
                    Upgrade to Pro
                  </button>
                )}
              </div>
              <div 
                className="relative group cursor-pointer" 
                onClick={() => setView('profile')}
                title="Account Settings"
              >
                {user.avatarUrl ? (
                   <img 
                    src={user.avatarUrl} 
                    alt={user.name}
                    className={`w-9 h-9 rounded-full object-cover border-2 transition-colors ${view === 'profile' ? 'ring-2 ring-primary-500' : ''} ${user.isPremium ? 'border-amber-500/50' : 'border-slate-700'}`}
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${view === 'profile' ? 'ring-2 ring-primary-500' : ''} ${user.isPremium ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    <UserIcon size={18} />
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowSettings(true)}
                title={`Settings ${getTooltipText('OPEN_SETTINGS')}`}
                className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-all"
              >
                <SettingsIcon size={20} />
              </button>

              <button 
                onClick={handleLogout}
                title="Sign Out"
                className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-all"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-0 relative">
        <div key={view} className="animate-fade-up">
          {view === 'home' && (
            <ModeSelection 
              onSelectMode={handleStartSession}
              onSelectScenario={handleStartScenario}
              isPremium={user.isPremium} 
              onOpenPricing={() => setShowPricing(true)}
            />
          )}
          
          {view === 'live' && selectedMode && (
            isProcessingEnd ? (
              <div className="flex flex-col items-center justify-center h-[80vh] space-y-8 animate-fade-in relative overflow-hidden">
                 {/* Processing UI */}
                 <div className="absolute inset-0 bg-primary-600/5 blur-3xl rounded-full scale-150 animate-pulse-slow"></div>
                 
                 <div className="relative z-10 flex flex-col items-center gap-6">
                   <div className="relative w-24 h-24">
                     <svg className="w-full h-full" viewBox="0 0 100 100">
                       <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                       <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray="283" strokeDashoffset="75" className="animate-[spin_2s_linear_infinite]" />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center">
                       <Zap size={32} className="text-primary-400 animate-pulse" fill="currentColor" />
                     </div>
                   </div>
                   
                   <div className="text-center space-y-2">
                     <h3 className="text-2xl font-bold text-white tracking-tight">Generating Report</h3>
                     <p className="text-slate-400">Our AI agents are analyzing your performance...</p>
                   </div>

                   <div className="w-full max-w-xs space-y-3 mt-4">
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"><CheckCircle2 size={10} className="text-slate-900" /></div>
                        <span>Processing Video Stream</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"><CheckCircle2 size={10} className="text-slate-900" /></div>
                        <span>Analyzing Audio Metrics</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white font-bold animate-pulse">
                        <div className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
                        <span>Compiling Improvement Plan...</span>
                      </div>
                   </div>
                 </div>
              </div>
            ) : (
              <LiveSession 
                mode={selectedMode} 
                scenario={selectedScenario}
                onEndSession={handleEndSession} 
                shortcuts={shortcuts}
              />
            )
          )}
          
          {view === 'dashboard' && (
            <Dashboard 
              history={sessionHistory} 
              lastSession={lastSession}
              onStartNew={() => setView('home')} 
              user={user}
              onOpenPricing={() => setShowPricing(true)}
              onSessionUpdate={handleSessionUpdate}
            />
          )}

          {view === 'profile' && (
            <UserProfile 
              user={user}
              onUpdateUser={updateUser}
              onLogout={handleLogout}
              onOpenPricing={() => setShowPricing(true)}
              addToast={addToast}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;