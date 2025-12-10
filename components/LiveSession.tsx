import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { SessionMode, AnalysisResult, Suggestion, Scenario, ShortcutDef } from '../types';
import { analyzeSessionSnapshot } from '../services/geminiService';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis 
} from 'recharts';
import { Mic, StopCircle, Zap, Activity, AlertCircle, Loader2, Video, Play, Eye, EyeOff, ChevronUp, ChevronDown, SquareTerminal, Recording } from 'lucide-react';

interface LiveSessionProps {
  mode: SessionMode;
  scenario?: Scenario;
  onEndSession: (metrics: AnalysisResult[], recordedBlob?: Blob) => void;
  shortcuts: ShortcutDef[];
}

// --- OPTIMIZED SUB-COMPONENTS ---

const AudioMeter = memo(({ stream }: { stream: MediaStream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!stream || !canvasRef.current) return;
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 64; 
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId: number;
    let isActive = true;
    const draw = () => {
      if (!isActive) return;
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 12;
      const width = (canvas.width / bars) - 4;
      for (let i = 0; i < bars; i++) {
        const binSize = Math.floor(bufferLength / bars);
        let sum = 0;
        for(let j = 0; j < binSize; j++) sum += dataArray[i * binSize + j];
        const avg = sum / binSize;
        const height = (avg / 255) * canvas.height;
        const x = i * (width + 4);
        const hue = 210 + (avg / 255) * 60; 
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - height, width, height, 4);
        ctx.fill();
      }
    };
    draw();
    return () => {
      isActive = false;
      cancelAnimationFrame(animationId);
      audioContext.close();
    };
  }, [stream]);
  return <canvas ref={canvasRef} width={200} height={40} />;
});

const ScenarioPromptOverlay = ({ scenario, showPrompt, setShowPrompt }: { scenario: Scenario, showPrompt: boolean, setShowPrompt: (v: boolean) => void }) => {
  if (!scenario) return null;
  if (showPrompt) {
    return (
      <div className="absolute top-12 right-4 w-80 glass-panel p-5 rounded-2xl border border-slate-700/50 shadow-2xl z-20 animate-slide-in-right backdrop-blur-xl">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <div className="bg-primary-500/20 p-1.5 rounded-lg text-primary-400"><SquareTerminal size={14} /></div>
            Challenge
          </h4>
          <button onClick={() => setShowPrompt(false)} className="text-slate-400 hover:text-white transition-colors">
            <ChevronUp size={14} />
          </button>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed font-mono">{scenario.prompt}</p>
      </div>
    );
  }
  return (
    <button onClick={() => setShowPrompt(true)} className="absolute top-12 right-4 bg-slate-900/80 p-3 rounded-xl text-slate-400 hover:text-white border border-slate-700/50 z-20 transition-all hover:scale-105 shadow-lg">
      <ChevronDown size={16} />
    </button>
  );
};

const StandardPromptOverlay = ({ scenario, showPrompt, setShowPrompt }: { scenario: Scenario, showPrompt: boolean, setShowPrompt: (v: boolean) => void }) => {
  if (!scenario) return null;
  return (
    <>
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl z-30 transition-all duration-500 ${showPrompt ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
         <div className="glass-panel bg-black/40 p-6 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl text-center relative">
            <p className="text-slate-200 text-base font-medium leading-relaxed">"{scenario.prompt}"</p>
            <button onClick={() => setShowPrompt(false)} className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white p-2 rounded-full border border-white/10 hover:bg-slate-800 transition-colors">
              <ChevronUp size={16} />
            </button>
         </div>
      </div>
      {!showPrompt && (
         <button onClick={() => setShowPrompt(true)} className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white px-5 py-2 rounded-full border border-white/10 hover:bg-slate-800 z-30 flex items-center gap-2 text-xs font-bold uppercase backdrop-blur-md shadow-xl transition-all hover:translate-y-1">
            Show Prompt <ChevronDown size={14} />
         </button>
      )}
    </>
  );
};

const MetricsOverlay = ({ metrics }: { metrics: AnalysisResult | null }) => {
  if (!metrics) return null;
  return (
    <div className="absolute top-8 left-8 flex flex-col gap-3 z-20 animate-scale-in origin-top-left">
      <span className={`px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-xl bg-black/40 border border-white/10 shadow-xl ${
        metrics.sentiment.includes('Positive') ? 'text-green-400 border-green-500/20' : 'text-yellow-400 border-yellow-500/20'
      }`}>
        {metrics.sentiment}
      </span>
      {metrics.metrics.pace && (
         <span className={`px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-xl bg-black/40 border border-white/10 shadow-xl flex items-center gap-2 ${
           metrics.metrics.pace === 'Good' ? 'text-blue-400 border-blue-500/20' : 'text-red-400 border-red-500/20'
         }`}>
           <Activity size={14} /> Pace: {metrics.metrics.pace}
         </span>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

const LiveSession: React.FC<LiveSessionProps> = ({ mode, scenario, onEndSession, shortcuts }) => {
  const [sessionState, setSessionState] = useState<'permission' | 'green-room' | 'live'>('permission');
  const [showPrompt, setShowPrompt] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const isCodingMode = mode === SessionMode.CODING_CHALLENGE;
  const [codeContent, setCodeContent] = useState(scenario?.initialCode || "// Write your solution here...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<AnalysisResult[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<AnalysisResult | null>(null);
  const [liveSuggestions, setLiveSuggestions] = useState<Suggestion[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const analysisInterval = useRef<number | null>(null);
  const isAnalyzingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (analysisInterval.current) window.clearInterval(analysisInterval.current);
    };
  }, []);

  const requestMediaAccess = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      setSessionState('green-room');
    } catch (err: any) {
      setCameraError(err.name === 'NotAllowedError' ? "Camera access denied." : "Could not access camera.");
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) videoRef.current.srcObject = stream;
  }, [stream, sessionState]);

  useEffect(() => {
    let timer: number;
    if (sessionState === 'live') timer = window.setInterval(() => setElapsedTime(p => p + 1), 1000);
    return () => { if (timer) window.clearInterval(timer); };
  }, [sessionState]);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const context = canvasRef.current.getContext('2d');
    if (!context) return null;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    return canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
  }, []);

  const performAnalysis = useCallback(async () => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;
    try {
      const imageBase64 = captureFrame();
      if (!imageBase64) { isAnalyzingRef.current = false; return; }
      const result = await analyzeSessionSnapshot(mode, imageBase64, null);
      setCurrentMetrics(result);
      setMetricsHistory(prev => [...prev, result]);
      const newSuggestions = result.suggestions.map((text, i) => ({ id: Date.now() + '-' + i, type: 'improvement' as const, text, timestamp: Date.now() }));
      setLiveSuggestions(prev => [...newSuggestions, ...prev].slice(0, 6));
    } catch (e) { console.error("Analysis loop error", e); } finally { isAnalyzingRef.current = false; }
  }, [captureFrame, mode]);

  const startSession = useCallback(() => {
    if (!stream) return;
    setSessionState('live');
    setMetricsHistory([]);
    setLiveSuggestions([]);
    setElapsedTime(0);
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' }); 
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: 'video/webm' }); onEndSession(metricsHistory, blob); };
      recorder.start(1000);
      analysisInterval.current = window.setInterval(performAnalysis, 4000);
      performAnalysis();
    } catch (err) { console.error("Recorder error", err); setSessionState('live'); analysisInterval.current = window.setInterval(performAnalysis, 4000); }
  }, [stream, onEndSession, performAnalysis, metricsHistory]);

  const stopSession = useCallback(() => {
    if (analysisInterval.current) window.clearInterval(analysisInterval.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    else onEndSession(metricsHistory);
  }, [metricsHistory, onEndSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getShortcutLabel = useCallback((action: string) => {
    const s = shortcuts.find(s => s.action === action);
    if (!s) return "";
    const parts = [];
    if (s.metaKey) parts.push('Cmd');
    if (s.ctrlKey) parts.push('Ctrl');
    if (s.altKey) parts.push('Alt');
    if (s.shiftKey) parts.push('Shift');
    parts.push(s.key === ' ' ? 'Space' : s.key);
    return `(${parts.join('+')})`;
  }, [shortcuts]);

  useEffect(() => {
    const handleSessionKeyDown = (e: KeyboardEvent) => {
       const check = (action: string) => {
        const def = shortcuts.find(s => s.action === action);
        if (!def) return false;
        const eventKey = e.key.toUpperCase();
        const defKey = def.key.toUpperCase();
        return (eventKey === defKey && e.ctrlKey === !!def.ctrlKey && e.altKey === !!def.altKey && e.shiftKey === !!def.shiftKey && e.metaKey === !!def.metaKey);
       };
       if (check('START_STOP_SESSION')) { e.preventDefault(); if (sessionState === 'green-room') startSession(); if (sessionState === 'live') stopSession(); } 
       else if (check('TOGGLE_METRICS')) { e.preventDefault(); setShowMetrics(prev => !prev); }
    };
    window.addEventListener('keydown', handleSessionKeyDown);
    return () => window.removeEventListener('keydown', handleSessionKeyDown);
  }, [sessionState, shortcuts, startSession, stopSession]);

  if (sessionState === 'permission') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center animate-fade-in">
        <div className="glass-panel p-12 rounded-[40px] max-w-lg w-full shadow-2xl relative overflow-hidden border border-white/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-purple-600 to-primary-600"></div>
          <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 text-primary-400 shadow-inner border border-slate-800">
             <Video size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Connect Your Studio</h2>
          <p className="text-slate-400 mb-10 leading-relaxed text-lg">CoachFlow needs access to your camera and microphone to provide real-time analysis.</p>
          {cameraError && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm text-left"><AlertCircle size={18} className="shrink-0 mt-0.5" />{cameraError}</div>}
          <button onClick={requestMediaAccess} className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-primary-500/25 active:scale-95 text-lg">
            Enable Camera & Mic
          </button>
        </div>
      </div>
    );
  }

  if (sessionState === 'green-room') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] p-4 animate-fade-up">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-10">
             <div>
                <h2 className="text-5xl font-black text-white mb-4 tracking-tight">Green Room</h2>
                <p className="text-slate-400 text-xl font-light">
                  {scenario ? `Preparing: ${scenario.title}` : "Check your lighting and sound."}
                </p>
             </div>
             
             {scenario && (
               <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 text-sm text-slate-300">
                 <p className="font-bold text-white mb-2 uppercase text-xs tracking-wider">Target Prompt</p>
                 <p className="text-lg leading-relaxed italic">"{scenario.prompt}"</p>
               </div>
             )}

             <div className="glass-panel p-8 rounded-3xl space-y-6 shadow-2xl">
                <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center"><Video size={24} /></div>
                      <span className="font-bold text-slate-200">Video Signal</span>
                   </div>
                   <div className="text-xs text-green-500 font-bold px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Excellent
                   </div>
                </div>
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center"><Mic size={24} /></div>
                          <span className="font-bold text-slate-200">Audio Input</span>
                      </div>
                   </div>
                   <div className="h-12 flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                      {stream && <AudioMeter stream={stream} />}
                   </div>
                </div>
             </div>
             <button onClick={startSession} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 text-white font-bold py-6 rounded-2xl transition-all shadow-xl hover:shadow-green-500/20 hover:-translate-y-1 flex items-center justify-center gap-3 text-xl group">
               <Play size={28} fill="currentColor" className="group-hover:scale-110 transition-transform" /> Start Session
             </button>
          </div>
          <div className="relative aspect-video bg-black rounded-[40px] overflow-hidden shadow-2xl border-4 border-slate-800 ring-1 ring-white/10 transform hover:scale-[1.01] transition-transform duration-500">
             <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
             <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg text-xs font-bold text-white border border-white/10">Preview</div>
          </div>
        </div>
      </div>
    );
  }

  const radarData = currentMetrics ? [
    { subject: 'Confidence', A: currentMetrics.metrics.confidence, fullMark: 100 },
    { subject: 'Clarity', A: currentMetrics.metrics.clarity, fullMark: 100 },
    { subject: 'Engagement', A: currentMetrics.metrics.engagement, fullMark: 100 },
    { subject: 'Relevance', A: currentMetrics.metrics.contentRelevance, fullMark: 100 },
  ] : [];

  const lineData = metricsHistory.map((m, i) => ({ time: i * 4, confidence: m.metrics.confidence }));

  return (
    <div className="flex flex-col h-full gap-6 max-w-[1800px] mx-auto p-6 animate-fade-in relative">
      <div className="flex justify-between items-center glass-panel px-8 py-5 rounded-2xl z-10 shadow-lg">
        <div className="flex items-center gap-5">
          <div className="relative">
             <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
             <div className="absolute inset-0 w-4 h-4 rounded-full bg-red-500 animate-ping opacity-75"></div>
          </div>
          <div>
            <h2 className="font-bold text-white tracking-wide uppercase text-sm flex items-center gap-2">
              {scenario ? scenario.title : mode} <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-slate-300">LIVE</span>
            </h2>
            <p className="text-slate-400 text-xs">AI Analysis Active</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
           <button onClick={() => setShowMetrics(!showMetrics)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
             {showMetrics ? <Eye size={20} /> : <EyeOff size={20} />}
           </button>
           <div className="text-4xl font-mono text-white font-bold tabular-nums tracking-widest text-glow drop-shadow-md">
             {formatTime(elapsedTime)}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 transition-all duration-500">
        <div className={`${showMetrics ? 'lg:col-span-8' : 'lg:col-span-12'} relative bg-black rounded-[32px] overflow-hidden shadow-2xl border border-slate-700 ring-1 ring-white/10 flex flex-col min-h-[500px] transition-all duration-500 group`}>
          {isCodingMode ? (
            <div className="flex flex-col h-full relative">
               <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
                 <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
                 <div className="ml-4 text-xs text-slate-400 font-mono">solution.js</div>
               </div>
               <div className="flex-1 relative bg-[#1e1e1e] flex">
                 <div className="w-12 bg-[#1e1e1e] border-r border-slate-800 pt-4 text-right pr-3 text-slate-600 font-mono text-sm select-none">{codeContent.split('\n').map((_, i) => (<div key={i}>{i + 1}</div>))}</div>
                 <textarea value={codeContent} onChange={(e) => setCodeContent(e.target.value)} className="flex-1 bg-transparent text-slate-200 font-mono text-sm p-4 outline-none resize-none leading-6" spellCheck={false} />
               </div>
               {scenario && <ScenarioPromptOverlay scenario={scenario} showPrompt={showPrompt} setShowPrompt={setShowPrompt} />}
               <div className="absolute bottom-4 right-4 w-64 aspect-video bg-black rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl z-20"><video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" /></div>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
              <div className="absolute inset-0 border-[6px] border-transparent rounded-[32px] pointer-events-none transition-colors duration-500 group-hover:border-white/5 animate-pulse-slow"></div>
              {/* Recording Indicator Border */}
              <div className="absolute inset-0 pointer-events-none z-20"><div className="absolute top-6 left-6 w-16 h-16 border-t-4 border-l-4 border-red-500/50 rounded-tl-2xl"></div><div className="absolute top-6 right-6 w-16 h-16 border-t-4 border-r-4 border-red-500/50 rounded-tr-2xl"></div><div className="absolute bottom-6 left-6 w-16 h-16 border-b-4 border-l-4 border-red-500/50 rounded-bl-2xl"></div><div className="absolute bottom-6 right-6 w-16 h-16 border-b-4 border-r-4 border-red-500/50 rounded-br-2xl"></div></div>
              {scenario && <StandardPromptOverlay scenario={scenario} showPrompt={showPrompt} setShowPrompt={setShowPrompt} />}
              <MetricsOverlay metrics={currentMetrics} />
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-10 left-0 right-0 flex justify-center z-30">
            <button onClick={stopSession} title={`End Session ${getShortcutLabel('START_STOP_SESSION')}`} className="group relative flex items-center gap-3 px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl bg-red-600 hover:bg-red-500 text-white overflow-hidden hover:scale-105 active:scale-95 border-4 border-red-800 hover:border-red-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <StopCircle fill="currentColor" /> End Session
            </button>
          </div>
        </div>

        <div className={`lg:col-span-4 flex flex-col gap-6 h-full transition-all duration-500 ${showMetrics ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 hidden lg:flex'}`}>
          {showMetrics && (
            <>
              <div className="glass-panel rounded-[32px] p-8 flex-1 min-h-[250px] flex flex-col relative overflow-hidden shadow-xl">
                <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><Activity size={16} /> Performance Radar</h3>
                <div className="flex-1 w-full h-full relative">
                  {currentMetrics ? (
                    <ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}><PolarGrid stroke="#334155" strokeDasharray="3 3" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} /><Radar name="Current" dataKey="A" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.3} isAnimationActive={true} /></RadarChart></ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-4"><Loader2 className="animate-spin text-primary-500" size={32} />Analyzing input stream...</div>
                  )}
                </div>
              </div>
              <div className="glass-panel rounded-[32px] p-8 flex-1 overflow-hidden flex flex-col max-h-[400px] shadow-xl">
                 <h3 className="text-slate-300 font-semibold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider"><Zap size={16} className="text-yellow-400 fill-yellow-400" /> Live Feedback</h3>
                 <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {liveSuggestions.length === 0 ? <div className="text-slate-500 text-center mt-10 text-sm italic">{isCodingMode ? "Explain your code out loud..." : "Listening for speech patterns..."}</div> : liveSuggestions.map((s) => (<div key={s.id} className="bg-slate-800/80 p-4 rounded-2xl border-l-4 border-yellow-400 animate-slide-in-right backdrop-blur-md shadow-lg hover:bg-slate-800 transition-colors"><p className="text-sm text-slate-200 leading-snug">{s.text}</p></div>))}
                 </div>
              </div>
               <div className="glass-panel rounded-[32px] p-8 h-48 shadow-xl">
                 <h3 className="text-slate-300 text-xs font-semibold mb-4 uppercase tracking-wider">Confidence Trend</h3>
                 <ResponsiveContainer width="100%" height="100%"><LineChart data={lineData}><XAxis dataKey="time" hide /><YAxis domain={[0, 100]} hide /><Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveSession;