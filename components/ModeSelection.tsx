
import React from 'react';
import { SessionMode } from '../types';
import { Briefcase, Users, Mic2, TrendingUp, Lock } from 'lucide-react';

interface ModeSelectionProps {
  onSelect: (mode: SessionMode) => void;
  isPremium: boolean;
  onOpenPricing: () => void;
}

const modes = [
  {
    id: SessionMode.SALES_PITCH,
    title: 'Sales Pitch',
    icon: <TrendingUp size={32} className="text-green-400" />,
    description: 'Optimize your hook, value proposition, and closing confidence.',
    gradient: 'from-green-500/10 to-green-500/5',
    border: 'group-hover:border-green-500/50',
    premium: false
  },
  {
    id: SessionMode.JOB_INTERVIEW,
    title: 'Job Interview',
    icon: <Briefcase size={32} className="text-blue-400" />,
    description: 'Practice behavioral answers and professional demeanor.',
    gradient: 'from-blue-500/10 to-blue-500/5',
    border: 'group-hover:border-blue-500/50',
    premium: false
  },
  {
    id: SessionMode.PRESENTATION,
    title: 'Public Speaking',
    icon: <Mic2 size={32} className="text-purple-400" />,
    description: 'Improve pacing, tone, and audience engagement.',
    gradient: 'from-purple-500/10 to-purple-500/5',
    border: 'group-hover:border-purple-500/50',
    premium: false
  },
  {
    id: SessionMode.INVESTOR_DEMO,
    title: 'Investor Demo',
    icon: <Users size={32} className="text-amber-400" />,
    description: 'Perfect your storytelling and handle Q&A pressure.',
    gradient: 'from-amber-500/10 to-amber-500/5',
    border: 'group-hover:border-amber-500/50',
    premium: true
  },
];

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelect, isPremium, onOpenPricing }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 py-12">
      <div className="text-center mb-16 animate-fade-up">
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 mb-6 tracking-tight">
          Choose Your Arena
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
          Select a practice mode below to initialize your real-time AI coaching session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
        {modes.map((mode, index) => {
          const isLocked = mode.premium && !isPremium;
          
          return (
            <button
              key={mode.id}
              onClick={() => isLocked ? onOpenPricing() : onSelect(mode.id)}
              className={`group relative overflow-hidden glass-panel p-8 rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl text-left border border-white/5 ${mode.border} ${index === 0 ? 'delay-100' : index === 1 ? 'delay-200' : index === 2 ? 'delay-300' : 'delay-400'} animate-fade-up`}
            >
              {/* Background Gradient on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10 flex justify-between items-start">
                <div className="mb-6 bg-slate-900/80 p-5 rounded-2xl border border-white/5 shadow-lg group-hover:scale-110 transition-transform duration-500">
                  {mode.icon}
                </div>
                {isLocked && (
                  <div className="bg-slate-950/80 p-2 rounded-full border border-slate-700 text-amber-400 shadow-lg">
                    <Lock size={16} />
                  </div>
                )}
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                  {mode.title}
                  {mode.premium && !isPremium && <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase font-bold tracking-widest">Pro</span>}
                </h3>
                <p className="text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors">{mode.description}</p>
              </div>

              {/* Decorative line */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:w-full transition-all duration-700 opacity-50" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelection;
