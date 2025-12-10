import React, { useState } from 'react';
import { SessionMode, Scenario } from '../types';
import { Briefcase, Users, Mic2, TrendingUp, Lock, Sparkles, BookOpen, Clock, Tag, Handshake, Shield, Terminal } from 'lucide-react';

interface ModeSelectionProps {
  onSelectMode: (mode: SessionMode) => void;
  onSelectScenario: (scenario: Scenario) => void;
  isPremium: boolean;
  onOpenPricing: () => void;
}

const MODES = [
  {
    id: SessionMode.SALES_PITCH,
    title: 'Sales Pitch',
    icon: <TrendingUp size={28} className="text-green-400" />,
    description: 'Optimize your hook, value proposition, and closing.',
    gradient: 'from-green-500/10 to-green-500/5',
    premium: false
  },
  {
    id: SessionMode.JOB_INTERVIEW,
    title: 'Job Interview',
    icon: <Briefcase size={28} className="text-blue-400" />,
    description: 'Practice behavioral answers and professional demeanor.',
    gradient: 'from-blue-500/10 to-blue-500/5',
    premium: false
  },
  {
    id: SessionMode.NEGOTIATION,
    title: 'Negotiation',
    icon: <Handshake size={28} className="text-indigo-400" />,
    description: 'Practice salary discussions and deal-making tactics.',
    gradient: 'from-indigo-500/10 to-indigo-500/5',
    premium: false
  },
  {
    id: SessionMode.PRESENTATION,
    title: 'Public Speaking',
    icon: <Mic2 size={28} className="text-purple-400" />,
    description: 'Improve pacing, tone, and audience engagement.',
    gradient: 'from-purple-500/10 to-purple-500/5',
    premium: false
  },
  {
    id: SessionMode.CODING_CHALLENGE,
    title: 'Technical Interview',
    icon: <Terminal size={28} className="text-pink-400" />,
    description: 'Live coding environment to practice technical explanation.',
    gradient: 'from-pink-500/10 to-pink-500/5',
    premium: false
  },
  {
    id: SessionMode.CONFLICT_RESOLUTION,
    title: 'Conflict Resolution',
    icon: <Shield size={28} className="text-rose-400" />,
    description: 'De-escalate tension and manage difficult conversations.',
    gradient: 'from-rose-500/10 to-rose-500/5',
    premium: true
  },
  {
    id: SessionMode.INVESTOR_DEMO,
    title: 'Investor Demo',
    icon: <Users size={28} className="text-amber-400" />,
    description: 'Perfect your storytelling and handle Q&A pressure.',
    gradient: 'from-amber-500/10 to-amber-500/5',
    premium: true
  },
];

const SCENARIOS: Scenario[] = [
  {
    id: 'elevator-60s',
    title: '60-Second Elevator Pitch',
    description: 'Pitch your startup or idea to a busy executive in under a minute.',
    difficulty: 'Beginner',
    mode: SessionMode.SALES_PITCH,
    durationMinutes: 1,
    prompt: "Imagine you just stepped into an elevator with a potential investor. Introduce yourself, state the problem you solve, your solution, and ask for a follow-up meeting.",
    tags: ['Sales', 'Speed']
  },
  {
    id: 'star-method',
    title: 'Tough Interview Question (STAR)',
    description: 'Practice the "Tell me about a time you failed" question.',
    difficulty: 'Intermediate',
    mode: SessionMode.JOB_INTERVIEW,
    durationMinutes: 3,
    prompt: "Use the STAR method (Situation, Task, Action, Result) to describe a time you failed at a project. Focus on what you learned and how you pivoted.",
    tags: ['Interview', 'Behavioral']
  },
  {
    id: 'salary-negotiation',
    title: 'Salary Negotiation',
    description: 'Negotiate a higher starting salary for a new job offer.',
    difficulty: 'Intermediate',
    mode: SessionMode.NEGOTIATION,
    durationMinutes: 5,
    prompt: "You've just received a job offer, but the salary is 10% lower than your target. Respectfully ask for more, justifying your value without being aggressive.",
    tags: ['Career', 'Money']
  },
  {
    id: 'react-debug',
    title: 'Frontend: React Debugging',
    description: 'Fix a broken counter component and optimize re-renders.',
    difficulty: 'Intermediate',
    mode: SessionMode.CODING_CHALLENGE,
    durationMinutes: 20,
    prompt: "This counter isn't updating correctly and logs too many renders. Walk us through how you identify and fix the issue.",
    initialCode: "import React, { useState } from 'react';\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n  \n  // Why isn't this working?\n  const increment = () => {\n    count = count + 1;\n  };\n\n  return <button onClick={increment}>{count}</button>;\n}",
    tags: ['React', 'Frontend', 'Debugging']
  },
  {
    id: 'difficult-feedback',
    title: 'Giving Difficult Feedback',
    description: 'Address an underperforming team member constructively.',
    difficulty: 'Advanced',
    mode: SessionMode.CONFLICT_RESOLUTION,
    durationMinutes: 5,
    prompt: "A team member has missed three deadlines in a row. Have a conversation to address the issue, understand the root cause, and set a plan for improvement.",
    tags: ['Leadership', 'Management']
  },
  {
    id: 'product-launch',
    title: 'Product Launch Keynote',
    description: 'Unveil a new feature to an excited audience.',
    difficulty: 'Advanced',
    mode: SessionMode.PRESENTATION,
    durationMinutes: 5,
    prompt: "You are launching 'Feature X'. Build anticipation, explain the 'Why', demonstrate the 'How', and end with an inspiring call to action.",
    tags: ['Public Speaking', 'Energy']
  },
  {
    id: 'vc-qa',
    title: 'VC Rapid Fire Q&A',
    description: 'Handle aggressive questions about your business model.',
    difficulty: 'Advanced',
    mode: SessionMode.INVESTOR_DEMO,
    durationMinutes: 10,
    prompt: "Defend your market size and customer acquisition cost. Be concise, confident, and data-driven. Do not get defensive.",
    tags: ['Investor', 'Pressure']
  }
];

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode, onSelectScenario, isPremium, onOpenPricing }) => {
  const [activeTab, setActiveTab] = useState<'modes' | 'scenarios'>('modes');

  return (
    <div className="flex flex-col items-center min-h-[85vh] px-6 py-12 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="text-center mb-10 animate-fade-up">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 mb-4 tracking-tight">
          Practice Arena
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
          Choose a freestyle mode or select a curated scenario to sharpen specific skills.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10 mb-10 shadow-lg animate-fade-up delay-100">
        <button
          onClick={() => setActiveTab('modes')}
          className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'modes' 
              ? 'bg-slate-800 text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Freestyle Modes
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'scenarios' 
              ? 'bg-primary-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen size={16} /> Scenario Library
        </button>
      </div>

      {/* Content */}
      <div className="w-full animate-fade-up delay-200">
        
        {activeTab === 'modes' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODES.map((mode) => {
              const isLocked = mode.premium && !isPremium;
              return (
                <button
                  key={mode.id}
                  onClick={() => isLocked ? onOpenPricing() : onSelectMode(mode.id)}
                  className={`group relative overflow-hidden glass-panel p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:shadow-xl text-left border border-white/5 hover:border-white/10 ${
                    mode.id === SessionMode.INVESTOR_DEMO ? 'md:col-span-2 lg:col-span-1' : ''
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-white/5 group-hover:scale-110 transition-transform">
                      {mode.icon}
                    </div>
                    {isLocked && <Lock size={16} className="text-amber-400" />}
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-2">{mode.title}</h3>
                    <p className="text-sm text-slate-400">{mode.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {SCENARIOS.map((scenario) => {
              const isLocked = !isPremium && scenario.difficulty === 'Advanced'; // Example locking logic
              
              return (
                <button
                  key={scenario.id}
                  onClick={() => isLocked ? onOpenPricing() : onSelectScenario(scenario)}
                  className="group relative flex flex-col glass-panel p-6 rounded-2xl text-left border border-white/5 hover:border-primary-500/30 transition-all hover:bg-slate-800/40"
                >
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          scenario.difficulty === 'Beginner' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                          scenario.difficulty === 'Intermediate' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                          'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {scenario.difficulty}
                        </span>
                        {scenario.mode === SessionMode.CODING_CHALLENGE && (
                           <span className="bg-pink-500/10 border border-pink-500/20 text-pink-400 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                             <Terminal size={10} /> Coding
                           </span>
                        )}
                        {isLocked && <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1"><Lock size={10} /> Pro</span>}
                      </div>
                      <div className="text-slate-500 flex items-center gap-1 text-xs">
                         <Clock size={12} /> {scenario.durationMinutes}m
                      </div>
                   </div>

                   <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                     {scenario.title}
                   </h3>
                   <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                     {scenario.description}
                   </p>

                   <div className="mt-auto flex items-center gap-2 pt-4 border-t border-white/5">
                      {scenario.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded-full">
                           <Tag size={10} /> {tag}
                        </span>
                      ))}
                      <div className="ml-auto flex items-center gap-1 text-primary-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                        Start <Sparkles size={12} />
                      </div>
                   </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeSelection;