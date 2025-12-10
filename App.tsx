import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { SessionMode, AnalysisResult, SessionData, User, Scenario, ShortcutDef, ToastMessage } from './types';
import { generatePostSessionSummary } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { LayoutDashboard, LogOut, User as UserIcon, Crown, Settings as SettingsIcon, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { ToastContainer } from './components/Toast';
import { AppErrorBoundary } from './components/ErrorBoundary';

// Lazy load components to optimize initial load speed
const ModeSelection = React.lazy(() => import('./components/ModeSelection'));
const LiveSession = React.lazy(() => import('./components/LiveSession'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Auth = React.lazy(() => import('./components/Auth'));
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const PricingModal = React.lazy(() => import('./components/PricingModal'));
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));
const UserProfile = React.lazy(() => import('./components/UserProfile'));

const DEFAULT_SHORTCUTS: ShortcutDef[] = [
  { action: 'START_STOP_SESSION', key: 'R', ctrlKey: false, altKey: true },
  { action: 'TOGGLE_METRICS', key: 'M', ctrlKey: true },
  { action: 'NAV_HOME', key: 'H', altKey: true },
  { action: 'NAV_DASHBOARD', key: 'D', altKey: true },
  { action: 'OPEN_SETTINGS', key: 'S', altKey: true }
];

// Full Screen Loader for Lazy Suspense transitions
const FullScreenLoader = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center animate-fade-in">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
      </div>
    </div>
    <p className="mt-4 text-slate-500 text-sm font-medium tracking-wide animate-pulse">LOADING COACHFLOW</p>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Views within the App (when logged in)
  const [view, setView] = useState<'home' | 'live' | 'dashboard' | 'profile'>('home');
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | undefined>(undefined);
  
  // Initialize history as empty array
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

  // --- SUPABASE & AUTH LOGIC ---

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setLoadingSession(false);
      }
    });

    // 2. Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // User logged in or refreshed
        fetchUserProfile(session.user.id, session.user.email!);
      } else {
        // User logged out
        setUser(null);
        setSessionHistory([]);
        setView('home');
        setAuthView('landing');
        setLoadingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Handle "Table Missing" error gracefully
        if (error.message && error.message.includes('Could not find the table')) {
           console.error("CRITICAL: Database tables missing. Please run supabase_setup.sql");
           addToast('error', 'Database Setup Required. Check Console.');
           // Fallback to minimal user state so app works in "demo" mode even if DB is down
           setUser({ id: userId, name: email.split('@')[0], email, isPremium: false, achievements: [], provider: 'email' });
        }
        // Handle "Row not found" (PGRST116) by auto-creating profile
        else if (error.code === 'PGRST116') {
           console.log("Profile missing, creating default profile for:", email);
           const { data: newData, error: createError } = await supabase
             .from('profiles')
             .insert([{ id: userId, email: email, name: email.split('@')[0], is_premium: false, streak_days: 0 }])
             .select()
             .single();
           
           if (createError) {
             console.error("Failed to auto-create profile:", createError.message);
             // Fallback to minimal user state
             setUser({ id: userId, name: email.split('@')[0], email, isPremium: false, achievements: [], provider: 'email' });
           } else if (newData) {
             setUser({
               id: newData.id,
               name: newData.name,
               email: newData.email,
               isPremium: newData.is_premium,
               avatarUrl: newData.avatar_url,
               streakDays: newData.streak_days,
               achievements: newData.achievements || [],
               provider: 'email',
               lastPracticeDate: newData.last_practice_date
             });
           }
        } else {
           console.error("Error fetching profile:", error.message);
           // Fallback to ensure app doesn't hang on loading
           setUser({ id: userId, name: email.split('@')[0], email, isPremium: false, achievements: [], provider: 'email' });
        }
      } else if (data) {
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          isPremium: data.is_premium,
          avatarUrl: data.avatar_url,
          streakDays: data.streak_days,
          achievements: data.achievements || [],
          provider: 'email',
          lastPracticeDate: data.last_practice_date
        });
      }
      
      // Load sessions regardless of profile state to be safe
      loadUserSessions(userId);
      
    } catch (e: any) {
      console.error("Profile load critical failure:", e?.message);
      // Absolute fallback
      setUser({ id: userId, name: email.split('@')[0], email, isPremium: false, achievements: [], provider: 'email' });
    } finally {
      setLoadingSession(false);
    }
  };

  const loadUserSessions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.message && error.message.includes('Could not find the table')) {
            console.warn("Sessions table missing. History disabled.");
        } else {
            console.error("Session load error:", error.message);
        }
        return;
      }

      if (data) {
        const mappedSessions: SessionData[] = data.map((s: any) => ({
          id: s.id,
          mode: s.mode as SessionMode,
          scenarioId: s.scenario_id,
          date: s.date,
          durationSeconds: s.duration_seconds,
          averageMetrics: s.average_metrics || { confidence: 0, clarity: 0, engagement: 0, contentRelevance: 0 },
          transcriptSummary: s.transcript_summary,
          improvementScript: s.improvement_script,
          transcript: s.transcript,
          videoUrl: s.video_url,
          bestTakeLabel: s.best_take_label
        }));
        setSessionHistory(mappedSessions);
        setLastSession(mappedSessions.length > 0 ? mappedSessions[mappedSessions.length - 1] : null);
      }
    } catch (e: any) {
      console.error("Session load failed:", e?.message);
    }
  };

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
    last.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = Math.abs(today.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays === 0) return currentStreak; 
    if (diffDays === 1) return currentStreak + 1;
    return 0;
  };

  const handleLogin = (authenticatedUser: User) => {
    // handled by auth listener
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
    setUser({ ...user, ...updates });
    // This is optimisic UI update, actual DB update happens in UserProfile component for specific fields
    // For global updates (like premium), we'd call Supabase here too.
    if (updates.isPremium !== undefined) {
        supabase.from('profiles').update({ is_premium: updates.isPremium }).eq('id', user.id).then();
    }
  };

  const handleUpgradeUser = () => {
    updateUser({ isPremium: true });
    setShowPricing(false);
    addToast('success', 'Welcome to CoachFlow Pro!');
  };

  const handleSessionUpdate = async (id: string, updates: Partial<SessionData>) => {
    const updatedHistory = sessionHistory.map(s => s.id === id ? { ...s, ...updates } : s);
    setSessionHistory(updatedHistory);
    
    if (lastSession?.id === id) {
      setLastSession(prev => prev ? { ...prev, ...updates } : null);
    }

    if (user) {
        // Map updates to DB columns
        const dbUpdates: any = {};
        if (updates.bestTakeLabel) dbUpdates.best_take_label = updates.bestTakeLabel;
        
        await supabase.from('sessions').update(dbUpdates).eq('id', id);
        addToast('success', 'Session updated');
    }
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
    
    // Update User Stats (Streak, Last Practice, Achievements)
    if (user) {
       const todayStr = new Date().toISOString();
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

       // Persist to Supabase
       try {
         const { error } = await supabase.from('sessions').insert({
            id: newSession.id,
            user_id: user.id,
            mode: newSession.mode,
            scenario_id: newSession.scenarioId,
            date: newSession.date,
            duration_seconds: newSession.durationSeconds,
            average_metrics: newSession.averageMetrics,
            transcript_summary: newSession.transcriptSummary,
            improvement_script: newSession.improvementScript,
            transcript: newSession.transcript,
            video_url: newSession.videoUrl // Note: Real app would upload video to Storage bucket first
         });
         
         if (error) throw error;

         await supabase.from('profiles').update({
            streak_days: newStreak,
            last_practice_date: todayStr,
            achievements: newBadges
         }).eq('id', user.id);

       } catch(e: any) {
         console.error("Failed to save session to DB:", e?.message);
         addToast('error', 'Failed to save session to cloud. Saved locally.');
       }
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

  // If loading session, show loader
  if (loadingSession) {
      return <FullScreenLoader />;
  }

  // If user is not logged in, show Landing or Auth pages
  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        <Suspense fallback={<FullScreenLoader />}>
          <PricingModal 
            isOpen={showPricing} 
            onClose={() => setShowPricing(false)} 
            onUpgrade={handleUpgradeUser} 
          />
        </Suspense>
        
        <Suspense fallback={null}>
          <SettingsModal 
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            shortcuts={shortcuts}
            onUpdateShortcuts={saveShortcuts}
            onResetShortcuts={resetShortcuts}
          />
        </Suspense>

        {/* Navbar */}
        <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white cursor-pointer group" onClick={() => user ? setView('home') : setAuthView('landing')}>
              <span className="bg-gradient-to-tr from-primary-600 to-primary-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">C</span>
              CoachFlow
            </div>
            
            {user && (
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
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="p-0 relative">
          <div key={view} className="animate-fade-up">
            <Suspense fallback={<FullScreenLoader />}>
              {!user ? (
                authView === 'landing' ? (
                  <LandingPage 
                    onLogin={() => setAuthView('login')} 
                    onSignup={() => setAuthView('signup')} 
                  />
                ) : (
                  <Auth 
                    key={authView} 
                    onLogin={handleLogin} 
                    initialView={authView} 
                    onBack={() => setAuthView('landing')}
                    addToast={addToast}
                  />
                )
              ) : (
                <>
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
                </>
              )}
            </Suspense>
          </div>
        </main>
      </div>
    </AppErrorBoundary>
  );
};

export default App;