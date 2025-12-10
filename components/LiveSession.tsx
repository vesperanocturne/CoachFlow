import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SessionMode, AnalysisResult, Suggestion } from '../types';
import { analyzeSessionSnapshot } from '../services/geminiService';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { Mic, StopCircle, Zap, Activity, AlertCircle, Loader2, Video, Volume2, Play } from 'lucide-react';

interface LiveSessionProps {
  mode: SessionMode;
  onEndSession: (metrics: AnalysisResult[], recordedBlob?: Blob) => void;
}

// Audio Visualizer Component
const AudioMeter = ({ stream }: { stream: MediaStream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!stream || !canvasRef.current) return;
    
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    
    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw simple volume bars
      const bars = 5;
      const width = canvas.width / bars;
      
      let sum = 0;
      for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const avgVolume = sum / bufferLength;

      // Normalize volume to 0-1 range roughly
      const vol = Math.min(avgVolume / 50, 1);
      
      for (let i = 0; i < bars; i++) {
        const height = canvas.height * vol * (0.5 + Math.random() * 0.5); // Add jitter
        const x = i * width + 2;
        
        ctx.fillStyle = vol > 0.1 ? '#3b82f6' : '#334155';
        ctx.fillRect(x, canvas.height - height, width - 4, height);
      }
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationId);
      audioContext.close();
    };
  }, [stream]);

  return <canvas ref={canvasRef} width={60} height={30} className="opacity-90" />;
};

const LiveSession: React.FC<LiveSessionProps> = ({ mode, onEndSession }) => {
  // Session State
  const [sessionState, setSessionState] = useState<'permission' | 'green-room' | 'live'>('permission');
  
  // Media Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Data State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const [metricsHistory, setMetricsHistory] = useState<AnalysisResult[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<AnalysisResult | null>(null);
  const [liveSuggestions, setLiveSuggestions] = useState<Suggestion[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const analysisInterval = useRef<number | null>(null);
  const isAnalyzingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (analysisInterval.current) window.clearInterval(analysisInterval.current);
    };
  }, [stream]);

  // Request Permissions (Explicit User Action)
  const requestMediaAccess = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      setStream(mediaStream);
      setSessionState('green-room');
    } catch (err: any) {
      console.error("Error accessing media devices:", err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? "Camera access denied. Please allow permissions in your browser settings." 
          : "Could not access camera/microphone. Please ensure they are connected."
      );
    }
  };

  // Bind stream to video element whenever it changes or state changes
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, sessionState]);

  // Timer Logic
  useEffect(() => {
    let timer: number;
    if (sessionState === 'live') {
      timer = window.setInterval(() => setElapsedTime(p => p + 1), 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [sessionState]);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const context = canvasRef.current.getContext('2d');
    if (!context) return null;
    
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.6);
    return dataUrl.split(',')[1];
  }, []);

  const performAnalysis = useCallback(async () => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;

    try {
      const imageBase64 = captureFrame();
      if (!imageBase64) {
        isAnalyzingRef.current = false;
        return;
      }

      const result = await analyzeSessionSnapshot(mode, imageBase64, null);
      
      setCurrentMetrics(result);
      setMetricsHistory(prev => [...prev, result]);
      
      const newSuggestions = result.suggestions.map((text, i) => ({
        id: Date.now() + '-' + i,
        type: 'improvement' as const,
        text,
        timestamp: Date.now()
      }));
      setLiveSuggestions(prev => [...newSuggestions, ...prev].slice(0, 4));

    } catch (e) {
      console.error("Analysis loop error", e);
    } finally {
      isAnalyzingRef.current = false;
    }
  }, [captureFrame, mode]);

  const getSupportedMimeType = () => {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  const startSession = () => {
    if (!stream) return;
    
    setSessionState('live');
    setMetricsHistory([]);
    setLiveSuggestions([]);
    setElapsedTime(0);
    chunksRef.current = [];

    try {
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const type = mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type });
        onEndSession(metricsHistory, blob);
      };

      recorder.start(1000);
      analysisInterval.current = window.setInterval(performAnalysis, 4000);
      performAnalysis();
    } catch (err) {
      console.error("Recorder error", err);
      // Fallback
      setSessionState('live');
      analysisInterval.current = window.setInterval(performAnalysis, 4000);
    }
  };

  const stopSession = () => {
    if (analysisInterval.current) window.clearInterval(analysisInterval.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
       onEndSession(metricsHistory);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // State: Permissions Request
  if (sessionState === 'permission') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-400">
             <Video size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Devices</h2>
          <p className="text-slate-400 mb-8">
            CoachFlow needs access to your camera and microphone to analyze your performance in real-time.
            We do not store raw footage unless you save it.
          </p>
          
          {cameraError && (
             <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm text-left">
              <AlertCircle size={18} className="shrink-0" />
              {cameraError}
            </div>
          )}

          <button 
            onClick={requestMediaAccess}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
          >
            <Video size={18} /> Enable Camera & Mic
          </button>
          <p className="text-xs text-slate-600 mt-4">You can verify your setup in the next step.</p>
        </div>
      </div>
    );
  }

  // State: Green Room (Setup)
  if (sessionState === 'green-room') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
             <div>
                <h2 className="text-3xl font-bold text-white mb-2">Green Room</h2>
                <p className="text-slate-400">Check your lighting, sound, and framing.</p>
             </div>
             
             <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/20 text-green-500 rounded-lg flex items-center justify-center">
                        <Video size={16} />
                      </div>
                      <span className="text-sm font-medium text-slate-300">Camera Active</span>
                   </div>
                   <div className="text-xs text-green-500 font-bold px-2 py-1 bg-green-500/10 rounded">Connected</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 text-blue-500 rounded-lg flex items-center justify-center">
                        <Mic size={16} />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-sm font-medium text-slate-300">Microphone Input</span>
                         <span className="text-xs text-slate-500">Visualizer active below</span>
                      </div>
                   </div>
                   {stream && <AudioMeter stream={stream} />}
                </div>
             </div>

             <div className="flex gap-4">
                <button 
                  onClick={startSession}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 text-lg hover:scale-[1.02]"
                >
                  <Play size={22} fill="currentColor" /> Start Session
                </button>
             </div>
          </div>

          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800">
             <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline
                className="w-full h-full object-cover transform scale-x-[-1]" 
              />
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 Preview Mode
              </div>
          </div>
        </div>
      </div>
    );
  }

  // State: Live Session (Existing UI Updated)
  const radarData = currentMetrics ? [
    { subject: 'Confidence', A: currentMetrics.metrics.confidence, fullMark: 100 },
    { subject: 'Clarity', A: currentMetrics.metrics.clarity, fullMark: 100 },
    { subject: 'Engagement', A: currentMetrics.metrics.engagement, fullMark: 100 },
    { subject: 'Relevance', A: currentMetrics.metrics.contentRelevance, fullMark: 100 },
  ] : [];

  const lineData = metricsHistory.map((m, i) => ({
    time: i * 4,
    confidence: m.metrics.confidence,
    engagement: m.metrics.engagement
  }));

  return (
    <div className="flex flex-col h-full gap-4 max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-500/20 animate-pulse">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">{mode} Mode</h2>
            <p className="text-slate-400 text-sm">Recording & Analyzing...</p>
          </div>
        </div>
        <div className="text-2xl font-mono text-primary-400 font-bold">
          {formatTime(elapsedTime)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Main Video Feed */}
        <div className="lg:col-span-2 relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col min-h-[400px]">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Advanced Overlay Stats */}
          {currentMetrics && (
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
              <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-black/50 border border-white/10 ${
                currentMetrics.sentiment === 'Positive' || currentMetrics.sentiment === 'Confident' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {currentMetrics.sentiment}
              </span>
              {/* Pace Meter */}
              {currentMetrics.metrics.pace && (
                 <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-black/50 border border-white/10 flex items-center gap-2 ${
                   currentMetrics.metrics.pace === 'Good' ? 'text-blue-400' : 'text-red-400'
                 }`}>
                   <Activity size={12} /> Pace: {currentMetrics.metrics.pace}
                 </span>
              )}
              {/* Filler Words */}
              {(currentMetrics.metrics.fillerWordCount || 0) > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-black/50 border border-white/10 text-amber-400">
                   Filler Words Detected
                </span>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
            <button
              onClick={stopSession}
              className="flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all transform shadow-xl bg-red-500 hover:bg-red-600 hover:scale-105 text-white"
            >
              <StopCircle /> End Session
            </button>
          </div>
        </div>

        {/* Sidebar: Metrics & Tips */}
        <div className="flex flex-col gap-6 h-full">
          
          {/* Live Score Radar */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex-1 min-h-[250px] flex flex-col">
            <h3 className="text-slate-300 font-semibold mb-2 flex items-center gap-2">
              <Activity size={18} /> Real-Time Rubric
            </h3>
            <div className="flex-1 w-full h-full relative">
              {currentMetrics ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Current" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  Analyzing performance...
                </div>
              )}
            </div>
          </div>

          {/* Suggestions Stream */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex-1 overflow-hidden flex flex-col">
             <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" /> AI Coach Suggestions
            </h3>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {liveSuggestions.length === 0 ? (
                <div className="text-slate-500 text-center mt-10 text-sm">
                  Listening and watching...
                </div>
              ) : (
                liveSuggestions.map((s) => (
                  <div key={s.id} className="bg-slate-700/50 p-3 rounded-lg border-l-4 border-yellow-400 animate-in slide-in-from-right fade-in duration-500">
                    <p className="text-sm text-slate-200">{s.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mini Trend Chart */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 h-40">
             <h3 className="text-slate-300 text-xs font-semibold mb-2">Confidence Trend</h3>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
             </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LiveSession;