import React, { useState } from 'react';
import { Play, Plus } from 'lucide-react';

interface TimerInputProps {
  onAdd: (title: string) => void;
}

const TimerInput: React.FC<TimerInputProps> = ({ onAdd }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <div className="bg-indigo-500 rounded-full p-1 shadow-lg shadow-indigo-500/20">
          <Plus size={16} className="text-white" />
        </div>
      </div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What are you working on? Press Enter to start..."
        className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 text-lg placeholder-slate-400 rounded-2xl py-5 pl-14 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xl backdrop-blur-sm"
      />
      <button
        type="submit"
        disabled={!title.trim()}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-2 rounded-xl transition-colors"
      >
        <Play size={20} fill="currentColor" />
      </button>
    </form>
  );
};

export default TimerInput;
