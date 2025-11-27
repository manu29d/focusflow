
import React, { useState, useEffect } from 'react';
import { Timer, HistoryItem } from './types';
import TimerInput from './components/TimerInput';
import TimerCard from './components/TimerCard';
import MiniTimer from './components/MiniTimer';
import HistoryView from './components/HistoryView';
import { LayoutGrid, CheckCircle2, BarChart2, Beaker, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateDemoData, generateDemoActiveTimers } from './utils/timeUtils';

const App: React.FC = () => {
  const [timers, setTimers] = useState<Timer[]>(() => {
    const saved = localStorage.getItem('focusflow-timers');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Separate state for demo active timers so we don't pollute real local storage
  const [demoActiveTimers, setDemoActiveTimers] = useState<Timer[]>([]);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('focusflow-history');
    return saved ? JSON.parse(saved) : [];
  });

  const [showHistory, setShowHistory] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoData, setDemoData] = useState<HistoryItem[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Determine which timers list to use
  const currentTimers = demoMode ? demoActiveTimers : timers;

  // Save to localStorage whenever REAL timers change
  useEffect(() => {
    localStorage.setItem('focusflow-timers', JSON.stringify(timers));
  }, [timers]);

  // Save history to localStorage (only if not demo mode)
  useEffect(() => {
    if (!demoMode) {
        localStorage.setItem('focusflow-history', JSON.stringify(history));
    }
  }, [history, demoMode]);

  // Generate demo data once
  useEffect(() => {
    setDemoData(generateDemoData());
    setDemoActiveTimers(generateDemoActiveTimers());
  }, []);

  // Whenever demo mode is toggled on, regenerate demo active timers to ensure they feel fresh
  useEffect(() => {
      if (demoMode) {
          setDemoActiveTimers(generateDemoActiveTimers());
          setCurrentPage(1);
      }
  }, [demoMode]);

  const setTimeState = (callback: (prev: Timer[]) => Timer[]) => {
      if (demoMode) {
          setDemoActiveTimers(callback);
      } else {
          setTimers(callback);
      }
  };

  const addTimer = (title: string) => {
    const newTimer: Timer = {
      id: crypto.randomUUID(),
      title,
      createdAt: Date.now(),
      isRunning: true, // Auto-start
      accumulatedMs: 0,
      lastStartTime: Date.now(),
      isMinimized: false,
    };

    setTimeState((prev) => {
      // Pause all other timers
      const pausedTimers = prev.map((t) => {
        if (t.isRunning) {
          return {
            ...t,
            isRunning: false,
            accumulatedMs: t.accumulatedMs + (t.lastStartTime ? Date.now() - t.lastStartTime : 0),
            lastStartTime: null,
          };
        }
        return t;
      });
      return [newTimer, ...pausedTimers];
    });
    // Jump to first page when adding new timer
    setCurrentPage(1);
  };

  const toggleTimer = (id: string) => {
    setTimeState((prev) => {
      // Find the timer we want to toggle
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;

      const now = Date.now();
      
      // If we are starting this timer, we must pause all others
      if (!target.isRunning) {
        return prev.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              isRunning: true,
              lastStartTime: now,
            };
          } else if (t.isRunning) {
            return {
              ...t,
              isRunning: false,
              accumulatedMs: t.accumulatedMs + (t.lastStartTime ? now - t.lastStartTime : 0),
              lastStartTime: null,
            };
          }
          return t;
        });
      } else {
        // We are stopping this timer
        return prev.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              isRunning: false,
              accumulatedMs: t.accumulatedMs + (t.lastStartTime ? now - t.lastStartTime : 0),
              lastStartTime: null,
            };
          }
          return t;
        });
      }
    });
  };

  const updateTimer = (id: string, updates: Partial<Timer>) => {
      setTimeState(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const archiveTimer = (timer: Timer) => {
      let totalTime = timer.accumulatedMs;
      if (timer.isRunning && timer.lastStartTime) {
        totalTime += Date.now() - timer.lastStartTime;
      }
      
      // Only save if it has some duration (e.g. > 5s)
      if (totalTime > 5000) {
        // Determine completion time based on creation time + duration
        // This preserves manually edited dates/times
        const completedAt = timer.createdAt + totalTime;

        const historyItem: HistoryItem = {
          id: timer.id,
          title: timer.title,
          completedAt: completedAt,
          durationMs: totalTime
        };
        if (demoMode) {
             setDemoData(h => [historyItem, ...h]);
        } else {
             setHistory(h => [historyItem, ...h]);
        }
      }
  };

  const deleteTimer = (id: string) => {
    setTimeState((prev) => {
      const timerToRemove = prev.find(t => t.id === id);
      if (timerToRemove) {
        archiveTimer(timerToRemove);
      }
      return prev.filter((t) => t.id !== id);
    });
  };

  const completeTimer = (id: string) => {
      // Same as delete, but conceptually specific "Finish" action
      deleteTimer(id);
  };

  const updateHistoryItem = (id: string, updates: Partial<HistoryItem>) => {
    if (demoMode) {
         setDemoData(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    } else {
        setHistory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }
  };

  const minimizeTimer = (id: string) => {
    setTimeState(prev => prev.map(t => t.id === id ? { ...t, isMinimized: true } : t));
  };

  const restoreTimer = (id: string) => {
    setTimeState(prev => prev.map(t => t.id === id ? { ...t, isMinimized: false } : t));
  };

  const activeTimers = currentTimers.filter(t => !t.isMinimized);
  const minimizedTimers = currentTimers.filter(t => t.isMinimized);

  // Pagination Logic
  const totalPages = Math.ceil(activeTimers.length / itemsPerPage);
  const paginatedTimers = activeTimers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  // Adjust current page if items are deleted and page becomes empty
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500/30">
      
      {/* Header / Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2"></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-12 flex flex-col gap-10 pb-24">
        
        {/* Header */}
        <header className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                  <CheckCircle2 size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                FocusFlow
              </h1>
            </div>
            <p className="text-slate-400 text-sm ml-1">Master your time, one task at a time.</p>
          </div>

          <button
            onClick={() => setShowHistory(true)}
            className="group flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all text-slate-300 hover:text-white"
          >
            <BarChart2 size={20} className="text-indigo-400 group-hover:text-indigo-300" />
            <span className="font-medium">History</span>
          </button>
        </header>

        {/* Dashboard Input */}
        <section>
          <TimerInput onAdd={addTimer} />
        </section>

        {/* Active Timers List */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium uppercase tracking-wider">
                <LayoutGrid size={14} />
                <span>Active Tasks</span>
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-xs">
                {activeTimers.length}
                </span>
                {demoMode && <span className="text-amber-500 text-xs ml-2">(Demo Mode)</span>}
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center gap-2 text-sm">
                    <button 
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-slate-500 font-mono text-xs">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
          </div>

          <div className="grid gap-4">
            {paginatedTimers.length === 0 && minimizedTimers.length === 0 ? (
               <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-800/20 text-slate-500">
                  <p>No timers running. Start focusing above!</p>
               </div>
            ) : (
              paginatedTimers.map((timer) => (
                <TimerCard
                  key={timer.id}
                  timer={timer}
                  onToggle={toggleTimer}
                  onDelete={deleteTimer}
                  onComplete={completeTimer}
                  onMinimize={minimizeTimer}
                  onUpdate={updateTimer}
                />
              ))
            )}
            
            {activeTimers.length === 0 && minimizedTimers.length > 0 && (
                <div className="text-center py-10 text-slate-500 text-sm">
                    {minimizedTimers.length} timer{minimizedTimers.length > 1 ? 's' : ''} minimized.
                </div>
            )}
          </div>
        </section>
      </div>

      {/* Render Minimized Timers (PiP) */}
      {minimizedTimers.map((timer) => (
        <MiniTimer
          key={timer.id}
          timer={timer}
          onToggle={toggleTimer}
          onRestore={restoreTimer}
        />
      ))}

      {/* History View Modal */}
      {showHistory && (
        <HistoryView 
          history={demoMode ? demoData : history} 
          onUpdate={updateHistoryItem}
          onClose={() => setShowHistory(false)} 
        />
      )}

      {/* Demo Mode Toggle (Bottom Left) */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setDemoMode(!demoMode)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium transition-all shadow-xl ${
            demoMode 
              ? 'bg-amber-500 border-amber-400 text-slate-900' 
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 backdrop-blur-md'
          }`}
        >
          <Beaker size={14} />
          {demoMode ? 'Demo Mode Active' : 'Enable Demo Data'}
        </button>
      </div>
    </div>
  );
};

export default App;
