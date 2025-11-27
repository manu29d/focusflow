import React, { useEffect, useState } from 'react';
import { Pause, Play, X, Maximize2 } from 'lucide-react';
import { Timer } from '../types';
import { formatTime, getElapsed } from '../utils/timeUtils';

interface MiniTimerProps {
  timer: Timer;
  onToggle: (id: string) => void;
  onRestore: (id: string) => void;
}

const MiniTimer: React.FC<MiniTimerProps> = ({ timer, onToggle, onRestore }) => {
  const [elapsed, setElapsed] = useState(getElapsed(timer));

  useEffect(() => {
    setElapsed(getElapsed(timer));
    let interval: number;
    if (timer.isRunning) {
      interval = window.setInterval(() => {
        setElapsed(getElapsed(timer));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // If not minimized, don't render this component
  if (!timer.isMinimized) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-up ring-1 ring-white/10">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-1"></div>
      <div className="p-4 backdrop-blur-xl bg-slate-900/95">
        <div className="flex justify-between items-start mb-2">
            <h4 className="text-slate-100 font-medium truncate pr-2 text-sm">{timer.title}</h4>
             <button 
                onClick={() => onRestore(timer.id)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Restore to dashboard"
            >
                <X size={16} />
            </button>
        </div>
        
        <div className="flex items-end justify-between">
            <div className="font-mono text-3xl font-bold text-white tracking-tighter">
                {formatTime(elapsed)}
            </div>
            
            <div className="flex gap-2">
                <button
                    onClick={() => onRestore(timer.id)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    title="Maximize"
                >
                    <Maximize2 size={18} />
                </button>
                <button
                    onClick={() => onToggle(timer.id)}
                    className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                        timer.isRunning 
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                >
                    {timer.isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MiniTimer;
