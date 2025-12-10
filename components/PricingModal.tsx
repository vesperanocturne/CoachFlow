import React, { useState } from 'react';
import { Check, X, Star, Zap } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onUpgrade();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
        >
          <X size={24} />
        </button>

        {/* Free Plan */}
        <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
          <h3 className="text-xl font-bold text-slate-300 mb-2">Starter</h3>
          <div className="text-3xl font-bold text-white mb-6">Free</div>
          <p className="text-slate-400 text-sm mb-8">Perfect for occasional practice and quick feedback.</p>
          
          <ul className="space-y-4 mb-8 flex-1">
            <FeatureItem text="3 Practice Sessions / Month" included={true} />
            <FeatureItem text="Basic Real-time Metrics" included={true} />
            <FeatureItem text="Sales & Interview Modes" included={true} />
            <FeatureItem text="Session Transcripts" included={false} />
            <FeatureItem text="Advanced Analytics" included={false} />
            <FeatureItem text="Investor Demo Mode" included={false} />
          </ul>

          <button 
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
          >
            Continue Free
          </button>
        </div>

        {/* Pro Plan */}
        <div className="flex-1 p-8 bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col relative overflow-hidden">
          {/* Decorative Gradient Blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-white">CoachFlow Pro</h3>
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star size={10} fill="currentColor" /> POPULAR
            </span>
          </div>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold text-white">$15</span>
            <span className="text-slate-400">/month</span>
          </div>
          <p className="text-slate-300 text-sm mb-8">Unlocking your full potential with unlimited AI coaching.</p>

          <ul className="space-y-4 mb-8 flex-1">
            <FeatureItem text="Unlimited Practice Sessions" included={true} highlight />
            <FeatureItem text="Advanced Real-time Metrics" included={true} highlight />
            <FeatureItem text="All Modes (incl. Investor Demo)" included={true} highlight />
            <FeatureItem text="Full Transcripts & Summaries" included={true} highlight />
            <FeatureItem text="Export PDF Reports" included={true} highlight />
            <FeatureItem text="Priority AI Processing" included={true} highlight />
          </ul>

          <button 
            onClick={handleUpgradeClick}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold shadow-lg shadow-primary-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <Zap size={18} className="fill-white" /> Upgrade to Pro
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-500 mt-4">No credit card required for demo.</p>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ text, included, highlight }: { text: string, included: boolean, highlight?: boolean }) => (
  <li className={`flex items-center gap-3 text-sm ${included ? (highlight ? 'text-white' : 'text-slate-300') : 'text-slate-600'}`}>
    {included ? (
      <div className={`p-0.5 rounded-full ${highlight ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
        <Check size={12} strokeWidth={3} />
      </div>
    ) : (
      <X size={16} />
    )}
    {text}
  </li>
);

export default PricingModal;