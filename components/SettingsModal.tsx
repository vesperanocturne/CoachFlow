import React, { useState, useEffect } from 'react';
import { X, Keyboard, RefreshCcw } from 'lucide-react';
import { ShortcutDef } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutDef[];
  onUpdateShortcuts: (newShortcuts: ShortcutDef[]) => void;
  onResetShortcuts: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  shortcuts, 
  onUpdateShortcuts,
  onResetShortcuts 
}) => {
  const [recordingAction, setRecordingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!recordingAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Ignore modifier-only key presses
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

      const newShortcut: Partial<ShortcutDef> = {
        key: e.key.toUpperCase(),
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
      };

      const updatedShortcuts = shortcuts.map(s => 
        s.action === recordingAction 
          ? { ...s, ...newShortcut } 
          : s
      );

      onUpdateShortcuts(updatedShortcuts);
      setRecordingAction(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingAction, shortcuts, onUpdateShortcuts]);

  if (!isOpen) return null;

  const formatShortcut = (s: ShortcutDef) => {
    const parts = [];
    if (s.metaKey) parts.push('Cmd');
    if (s.ctrlKey) parts.push('Ctrl');
    if (s.altKey) parts.push('Alt');
    if (s.shiftKey) parts.push('Shift');
    parts.push(s.key === ' ' ? 'Space' : s.key);
    return parts.join(' + ');
  };

  const getLabel = (action: string) => {
     switch(action) {
       case 'START_STOP_SESSION': return 'Start / Stop Session';
       case 'NAV_HOME': return 'Go to Home';
       case 'NAV_DASHBOARD': return 'Go to Dashboard';
       case 'TOGGLE_METRICS': return 'Toggle Metrics Visibility';
       case 'OPEN_SETTINGS': return 'Open Settings';
       default: return action;
     }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
             <div className="bg-primary-500/20 p-2 rounded-lg text-primary-400">
                <Keyboard size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
               <p className="text-sm text-slate-400">Customize your controls for a faster workflow.</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid gap-4">
            {shortcuts.map((shortcut) => (
              <div 
                key={shortcut.action}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  recordingAction === shortcut.action 
                    ? 'bg-primary-900/20 border-primary-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="font-medium text-slate-200">{getLabel(shortcut.action)}</span>
                
                <button
                  onClick={() => setRecordingAction(shortcut.action)}
                  className={`min-w-[140px] px-4 py-2 rounded-lg border font-mono text-sm font-bold transition-all text-center ${
                    recordingAction === shortcut.action
                      ? 'bg-primary-500 text-white border-primary-400 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {recordingAction === shortcut.action ? 'Press keys...' : formatShortcut(shortcut)}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center">
          <button 
            onClick={onResetShortcuts}
            className="text-slate-500 hover:text-slate-300 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <RefreshCcw size={14} /> Reset to Defaults
          </button>
          <button 
            onClick={onClose}
            className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;