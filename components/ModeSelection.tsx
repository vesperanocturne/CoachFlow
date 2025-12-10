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
    color: 'hover:border-green-500/50',
    premium: false
  },
  {
    id: SessionMode.JOB_INTERVIEW,
    title: 'Job Interview',
    icon: <Briefcase size={32} className="text-blue-400" />,
    description: 'Practice behavioral answers and professional demeanor.',
    color: 'hover:border-blue-500/50',
    premium: false
  },
  {
    id: SessionMode.PRESENTATION,
    title: 'Public Speaking',
    icon: <Mic2 size={32} className="text-purple-400" />,
    description: 'Improve pacing, tone, and audience engagement.',
    color: 'hover:border-purple-500/50',
    premium: false
  },
  {
    id: SessionMode.INVESTOR_DEMO,
    title: 'Investor Demo',
    icon: <Users size={32} className="text-amber-400" />,
    description: 'Perfect your storytelling and handle Q&A pressure.',
    color: 'hover:border-amber-500/50',
    premium: true
  },
];

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelect, isPremium, onOpenPricing }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
          CoachFlow
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Your real-time AI communication coach. Select a mode to begin your practice session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {modes.map((mode) => {
          const isLocked = mode.premium && !isPremium;
          
          return (
            <button
              key={mode.id}
              onClick={() => isLocked ? onOpenPricing() : onSelect(mode.id)}
              className={`group relative bg-slate-800 p-8 rounded-2xl border border-slate-700 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${isLocked ? 'opacity-75 cursor-default' : mode.color}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 ${!isLocked && 'group-hover:opacity-100'} rounded-2xl transition-opacity`} />
              
              <div className="flex justify-between items-start">
                <div className="mb-4 bg-slate-900/50 w-fit p-4 rounded-xl border border-slate-700/50">
                  {mode.icon}
                </div>
                {isLocked && (
                  <div className="bg-slate-900/80 p-2 rounded-full border border-slate-700 text-amber-400">
                    <Lock size={16} />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                {mode.title}
                {mode.premium && !isPremium && <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Pro</span>}
              </h3>
              <p className="text-slate-400">{mode.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelection;