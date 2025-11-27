
import React, { useEffect, useState } from 'react';
import { Play, Pause, X, Minimize2, Clock, Check, Edit2, Save } from 'lucide-react';
import { Timer } from '../types';
import { formatTime, getElapsed, toDateTimeLocal } from '../utils/timeUtils';

interface TimerCardProps {
  timer: Timer;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMinimize: (id: string) => void;
  onComplete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Timer>) => void;
}

const TimerCard: React.FC<TimerCardProps> = ({ timer, onToggle, onDelete, onMinimize, onComplete, onUpdate }) => {
  const [elapsed, setElapsed] = useState(getElapsed(timer));
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    createdAt: '',
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    setElapsed(getElapsed(timer)); // Update immediately on prop change
    
    let interval: number;
    if (timer.isRunning) {
      interval = window.setInterval(() => {
        setElapsed(getElapsed(timer));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const startEditing = () => {
    const currentElapsed = getElapsed(timer);
    const totalSeconds = Math.floor(currentElapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    setEditForm({
      title: timer.title,
      createdAt: toDateTimeLocal(timer.createdAt),
      hours,
      minutes,
      seconds
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    const newAccumulatedMs = ((editForm.hours * 3600) + (editForm.minutes * 60) + editForm.seconds) * 1000;
    const newCreatedAt = new Date(editForm.createdAt).getTime();

    // If timer is running, we need to reset lastStartTime to NOW, so that the accumulatedMs is the "base"
    // and counting continues from there.
    // If timer is paused, we just set accumulatedMs.
    
    onUpdate(timer.id, {
      title: editForm.title,
      createdAt: newCreatedAt,
      accumulatedMs: newAccumulatedMs,
      lastStartTime: timer.isRunning ? Date.now() : null
    });
    
    setIsEditing(false);
  };

  const isRunning = timer.isRunning;

  // Don't render if minimized (it's handled by the floating component)
  if (timer.isMinimized) return null;

  if (isEditing) {
    return (
      <div className="rounded-2xl border border-indigo-500/50 bg-slate-800/80 p-5 shadow-lg animate-fade-in relative overflow-hidden">
        <div className="space-y-4 relative z-10">
          <div>
            <label className="text-xs text-slate-500 uppercase font-semibold">Task Name</label>
            <input 
              type="text" 
              value={editForm.title}
              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none transition-colors"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
               <label className="text-xs text-slate-500 uppercase font-semibold">Started At</label>
               <input 
                  type="datetime-local" 
                  value={editForm.createdAt}
                  onChange={(e) => setEditForm({...editForm, createdAt: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 outline-none transition-colors"
                />
            </div>
            <div>
               <label className="text-xs text-slate-500 uppercase font-semibold">Elapsed Duration</label>
               <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5">
                  <input 
                    type="number" min="0" 
                    value={editForm.hours}
                    onChange={(e) => setEditForm({...editForm, hours: parseInt(e.target.value) || 0})}
                    className="w-10 bg-transparent text-right text-white outline-none"
                    placeholder="HH"
                  />
                  <span className="text-slate-500">:</span>
                  <input 
                    type="number" min="0" max="59"
                    value={editForm.minutes}
                    onChange={(e) => setEditForm({...editForm, minutes: parseInt(e.target.value) || 0})}
                    className="w-10 bg-transparent text-right text-white outline-none"
                    placeholder="MM"
                  />
                  <span className="text-slate-500">:</span>
                  <input 
                    type="number" min="0" max="59"
                    value={editForm.seconds}
                    onChange={(e) => setEditForm({...editForm, seconds: parseInt(e.target.value) || 0})}
                    className="w-10 bg-transparent text-right text-white outline-none"
                    placeholder="SS"
                  />
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={saveEdit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 group
      ${isRunning 
        ? 'bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
        : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
      }`}
    >
      {/* Active Indicator Strip */}
      {isRunning && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 animate-pulse"></div>
      )}

      <div className="p-5 flex items-center justify-between gap-4">
        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 group/title">
            <h3 className={`font-semibold text-lg truncate ${isRunning ? 'text-white' : 'text-slate-300'}`}>
              {timer.title}
            </h3>
            {isRunning && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            )}
            <button
               onClick={startEditing}
               className="ml-2 opacity-0 group-hover/title:opacity-100 p-1 text-slate-500 hover:text-indigo-400 transition-opacity"
               title="Edit Task"
            >
               <Edit2 size={14} />
            </button>
          </div>
          <div className={`font-mono text-3xl tracking-tight ${isRunning ? 'text-indigo-200' : 'text-slate-400'}`}>
            {formatTime(elapsed)}
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-2">
          {isRunning && (
             <button
             onClick={() => onMinimize(timer.id)}
             title="Minimize to PiP"
             className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
           >
             <Minimize2 size={20} />
           </button>
          )}

          <button
            onClick={() => onComplete(timer.id)}
            title="Mark as Complete"
            className="p-2 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
          >
            <Check size={20} />
          </button>

          <button
            onClick={() => onToggle(timer.id)}
            className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isRunning 
                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
            }`}
          >
            {isRunning ? (
              <Pause size={24} fill="currentColor" className="opacity-90" />
            ) : (
              <Play size={24} fill="currentColor" className="ml-1" />
            )}
          </button>

          <button
            onClick={() => onDelete(timer.id)}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* Background decoration for active state */}
      {isRunning && (
         <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <Clock size={120} />
         </div>
      )}
    </div>
  );
};

export default TimerCard;
