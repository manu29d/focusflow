
import React, { useMemo, useState } from 'react';
import { X, TrendingUp, Calendar, Clock, ChevronLeft, BarChart3, Edit2, Save } from 'lucide-react';
import { HistoryItem } from '../types';
import { 
  formatDurationShort, 
  getDayName, 
  isSameDay, 
  getMonthName, 
  isSameMonth, 
  formatDateFull,
  formatMonthYear,
  getStartOfWeek,
  isSameWeek,
  formatWeekRange,
  toDateTimeLocal,
  getWeeksInMonth
} from '../utils/timeUtils';

interface HistoryViewProps {
  history: HistoryItem[];
  onUpdate: (id: string, updates: Partial<HistoryItem>) => void;
  onClose: () => void;
}

// Mode: 'preset' = Last X Days, 'drilldown' = Year > Month > Week > Day
type ViewMode = 'preset' | 'drilldown';
type DrillLevel = 'year' | 'month' | 'week';

const HistoryView: React.FC<HistoryViewProps> = ({ history, onUpdate, onClose }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('preset');
  const [presetDays, setPresetDays] = useState<number>(7);
  
  const [drillLevel, setDrillLevel] = useState<DrillLevel>('year');
  const [focusDate, setFocusDate] = useState<number>(Date.now());
  
  // Track if we are in a drilldown state originating from a preset view (e.g. 30D -> Week)
  const [isDrilledFromPreset, setIsDrilledFromPreset] = useState(false);

  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);

  // Edit logic
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; date: string; hours: number; minutes: number }>({
    title: '', date: '', hours: 0, minutes: 0
  });

  const startEdit = (item: HistoryItem) => {
    setEditingId(item.id);
    const totalMinutes = Math.floor(item.durationMs / 60000);
    setEditForm({
      title: item.title,
      date: toDateTimeLocal(item.completedAt),
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60
    });
  };

  const saveEdit = () => {
    if (editingId) {
      const durationMs = (editForm.hours * 60 + editForm.minutes) * 60000;
      const completedAt = new Date(editForm.date).getTime();
      onUpdate(editingId, {
        title: editForm.title,
        completedAt,
        durationMs
      });
      setEditingId(null);
    }
  };

  // Calculate chart data
  const chartData = useMemo(() => {
    const dataPoints = [];
    
    // VIEW 1: PRESET (Last 7, 14 days) - Daily Bars
    // VIEW 1b: PRESET (Last 30 days) - Weekly Bars
    if (viewMode === 'preset') {
      const today = new Date();
      
      if (presetDays === 30) {
        // Show last 5 weeks
        const currentWeekStart = getStartOfWeek(today.getTime());
        for (let i = 4; i >= 0; i--) {
            const d = new Date(currentWeekStart);
            d.setDate(d.getDate() - (i * 7));
            const weekStartTs = d.getTime();
            
            const totalMs = history
               .filter(item => isSameWeek(item.completedAt, weekStartTs))
               .reduce((acc, item) => acc + item.durationMs, 0);

            dataPoints.push({
               timestamp: weekStartTs,
               totalMs,
               label: `Wk ${d.getDate()}`,
               fullLabel: `Week: ${formatWeekRange(weekStartTs)}`,
               type: 'week'
            });
        }
      } else {
          // 7 or 14 days (Daily)
          today.setHours(23, 59, 59, 999);
          for (let i = presetDays - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const timestamp = d.getTime();
            
            const totalMs = history
              .filter(item => isSameDay(item.completedAt, timestamp))
              .reduce((acc, item) => acc + item.durationMs, 0);

            dataPoints.push({
              timestamp,
              totalMs,
              label: getDayName(timestamp),
              fullLabel: formatDateFull(timestamp),
              type: 'day'
            });
          }
      }
    } 
    // VIEW 2: DRILLDOWN HIERARCHY
    else {
        // LEVEL 1: YEAR VIEW -> Show 12 Months
        if (drillLevel === 'year') {
          const now = new Date();
          // Show last 12 months including current
          for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const timestamp = d.getTime();
            
            const totalMs = history
              .filter(item => isSameMonth(item.completedAt, timestamp))
              .reduce((acc, item) => acc + item.durationMs, 0);
              
            dataPoints.push({
              timestamp,
              totalMs,
              label: getMonthName(timestamp),
              fullLabel: formatMonthYear(timestamp),
              type: 'month'
            });
          }
        } 
        // LEVEL 2: MONTH VIEW -> Show Weeks
        else if (drillLevel === 'month') {
          const weeks = getWeeksInMonth(focusDate);
          
          weeks.forEach((weekStart) => {
             const totalMs = history
              .filter(item => isSameWeek(item.completedAt, weekStart))
              .reduce((acc, item) => acc + item.durationMs, 0);

             dataPoints.push({
               timestamp: weekStart,
               totalMs,
               label: `Wk ${new Date(weekStart).getDate()}`,
               fullLabel: `Week: ${formatWeekRange(weekStart)}`,
               type: 'week'
             });
          });
        }
        // LEVEL 3: WEEK VIEW -> Show Days
        else if (drillLevel === 'week') {
          const start = getStartOfWeek(focusDate);
          for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const timestamp = d.getTime();
            
            const totalMs = history
              .filter(item => isSameDay(item.completedAt, timestamp))
              .reduce((acc, item) => acc + item.durationMs, 0);

            dataPoints.push({
              timestamp,
              totalMs,
              label: getDayName(timestamp),
              fullLabel: formatDateFull(timestamp),
              type: 'day'
            });
          }
        }
    }

    const maxMs = Math.max(...dataPoints.map(s => s.totalMs), 1);
    return { dataPoints, maxMs };
  }, [history, viewMode, presetDays, drillLevel, focusDate]);

  // Filter list items based on view settings
  const filteredItems = useMemo(() => {
    let items = [...history];

    if (viewMode === 'preset') {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const start = new Date(today);
        start.setDate(start.getDate() - presetDays);
        start.setHours(0, 0, 0, 0);

        items = items.filter(item => item.completedAt >= start.getTime() && item.completedAt <= today.getTime());
        
        // If 30 days, we might be filtering by a clicked week?
        // No, in preset mode, clicking a bar usually filters. 
        // But for 30d, clicking a bar drills down.
        // So for 7/14 days:
        if (presetDays !== 30 && selectedTimestamp) {
            items = items.filter(item => isSameDay(item.completedAt, selectedTimestamp));
        }

    } else {
        // Drilldown logic
        if (drillLevel === 'year') {
             // Show all items in the range of the displayed months (approx last 12 months)
             const earliest = chartData.dataPoints[0]?.timestamp || 0;
             const now = new Date();
             const latest = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
             items = items.filter(item => item.completedAt >= earliest && item.completedAt <= latest);
        } else if (drillLevel === 'month') {
            items = items.filter(item => isSameMonth(item.completedAt, focusDate));
        } else if (drillLevel === 'week') {
            items = items.filter(item => isSameWeek(item.completedAt, focusDate));
        }

        if (selectedTimestamp && drillLevel === 'week') {
             items = items.filter(item => isSameDay(item.completedAt, selectedTimestamp));
        }
    }

    return items.sort((a, b) => b.completedAt - a.completedAt);
  }, [history, viewMode, presetDays, drillLevel, focusDate, selectedTimestamp, chartData.dataPoints]);

  const handleBarClick = (point: any) => {
    if (viewMode === 'preset') {
        if (presetDays === 30 && point.type === 'week') {
            // Drill down into this week
            setFocusDate(point.timestamp);
            setDrillLevel('week');
            setViewMode('drilldown');
            setIsDrilledFromPreset(true);
        } else {
             // Just filter the list for 7/14 days
             setSelectedTimestamp(prev => prev === point.timestamp ? null : point.timestamp);
        }
    } else {
        if (drillLevel === 'year') {
            setFocusDate(point.timestamp);
            setDrillLevel('month');
        } else if (drillLevel === 'month') {
            setFocusDate(point.timestamp);
            setDrillLevel('week');
        } else if (drillLevel === 'week') {
            setSelectedTimestamp(prev => prev === point.timestamp ? null : point.timestamp);
        }
    }
  };

  const handleBack = () => {
    setSelectedTimestamp(null);
    
    if (isDrilledFromPreset) {
        setViewMode('preset');
        setPresetDays(30);
        setIsDrilledFromPreset(false);
        return;
    }

    if (viewMode === 'drilldown') {
        if (drillLevel === 'week') setDrillLevel('month');
        else if (drillLevel === 'month') setDrillLevel('year');
    }
  };

  const getHeaderLabel = () => {
    if (viewMode === 'preset' && presetDays !== 30) return `Last ${presetDays} Days`;
    if (viewMode === 'preset' && presetDays === 30) return `Last 30 Days (Weekly)`;
    if (drillLevel === 'year') return 'Yearly Activity';
    if (drillLevel === 'month') return formatMonthYear(focusDate);
    if (drillLevel === 'week') return `Week: ${formatWeekRange(focusDate)}`;
    return 'History';
  };

  const setFilter = (days: number | 'year') => {
      setSelectedTimestamp(null);
      setIsDrilledFromPreset(false);
      
      if (days === 'year') {
          setViewMode('drilldown');
          setDrillLevel('year');
      } else {
          setViewMode('preset');
          setPresetDays(days);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">History</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-700/50 bg-slate-900/50 p-2 gap-1 justify-center">
            {[7, 14, 30].map(days => (
                <button
                    key={days}
                    onClick={() => setFilter(days)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        viewMode === 'preset' && presetDays === days && !isDrilledFromPreset
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                >
                    {days} Days
                </button>
            ))}
            <div className="w-px bg-slate-700 mx-2 h-6 self-center"></div>
             <button
                onClick={() => setFilter('year')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'drilldown' && !isDrilledFromPreset
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
                Yearly
            </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          <div className="p-6 space-y-8">
            
            {/* Chart Section */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-2">
                  {((viewMode === 'drilldown' && drillLevel !== 'year') || isDrilledFromPreset) && (
                    <button 
                      onClick={handleBack}
                      className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 -ml-2 transition-colors"
                      title="Go Back"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 size={16} /> 
                    {getHeaderLabel()}
                  </h3>
                </div>
              </div>
              
              <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 select-none">
                {chartData.dataPoints.map((point) => {
                  const heightPercentage = Math.max((point.totalMs / chartData.maxMs) * 100, 4);
                  const isSelected = selectedTimestamp === point.timestamp;
                  
                  return (
                    <div 
                      key={point.timestamp}
                      className="group flex flex-col items-center flex-1 h-full justify-end cursor-pointer relative"
                      onClick={() => handleBarClick(point)}
                    >
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-slate-800 text-xs px-2 py-1 rounded shadow-lg border border-slate-700 whitespace-nowrap">
                        {point.fullLabel}: {formatDurationShort(point.totalMs)}
                        {((viewMode === 'drilldown' && drillLevel !== 'week') || (viewMode === 'preset' && presetDays === 30)) && <span className="block text-[10px] text-indigo-400 mt-1">Click to drill down</span>}
                      </div>

                      <div 
                        style={{ height: `${heightPercentage}%` }}
                        className={`w-full max-w-[2rem] rounded-t-sm transition-all duration-300 relative ${
                          isSelected 
                            ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                            : point.totalMs === 0
                              ? 'bg-slate-800/50 hover:bg-slate-700'
                              : 'bg-slate-700 hover:bg-indigo-400/50'
                        }`}
                      />
                      <span className={`text-[10px] mt-2 font-medium truncate w-full text-center ${
                        isSelected ? 'text-indigo-400' : 'text-slate-500'
                      }`}>
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Session List */}
            <section>
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-900 z-10 py-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                   <h3 className="text-lg font-semibold text-slate-200">
                     Sessions
                   </h3>
                   {selectedTimestamp && (
                    <button 
                      onClick={() => setSelectedTimestamp(null)}
                      className="ml-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded-full flex items-center gap-1 transition-colors"
                    >
                      <X size={12} /> Clear Filter
                    </button>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">
                   {filteredItems.length} items
                </span>
              </div>

              <div className="space-y-3">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-dashed border-slate-800">
                    <Clock size={40} className="mx-auto text-slate-700 mb-3" />
                    <p className="text-slate-500">No sessions recorded for this period.</p>
                  </div>
                ) : (
                  filteredItems.map((item, idx) => (
                    <div 
                      key={`${item.id}-${idx}`} 
                      className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 transition-all group"
                    >
                      {editingId === item.id ? (
                        <div className="space-y-3">
                          <input 
                            type="text" 
                            value={editForm.title}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                            placeholder="Task Name"
                          />
                          <div className="flex gap-2">
                             <input 
                              type="datetime-local" 
                              value={editForm.date}
                              onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                              className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                            <div className="flex items-center gap-1 bg-slate-900 border border-slate-600 rounded px-2">
                              <input 
                                type="number" 
                                min="0"
                                value={editForm.hours}
                                onChange={(e) => setEditForm({...editForm, hours: parseInt(e.target.value) || 0})}
                                className="w-12 bg-transparent text-sm text-white text-right outline-none"
                              />
                              <span className="text-xs text-slate-500">h</span>
                              <input 
                                type="number" 
                                min="0"
                                max="59"
                                value={editForm.minutes}
                                onChange={(e) => setEditForm({...editForm, minutes: parseInt(e.target.value) || 0})}
                                className="w-12 bg-transparent text-sm text-white text-right outline-none"
                              />
                              <span className="text-xs text-slate-500">m</span>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-2">
                             <button 
                               onClick={() => setEditingId(null)}
                               className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                             >
                               Cancel
                             </button>
                             <button 
                               onClick={saveEdit}
                               className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded flex items-center gap-1"
                             >
                               <Save size={12} /> Save
                             </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1 pr-4">
                            <h4 className="text-slate-200 font-medium truncate group-hover:text-indigo-200 transition-colors">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <Calendar size={12} />
                              <span>{formatDateFull(item.completedAt)}</span>
                              <span>•</span>
                              <span>{new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-indigo-400 font-mono font-medium whitespace-nowrap bg-indigo-500/10 px-3 py-1 rounded-lg">
                              {formatDurationShort(item.durationMs)}
                            </div>
                            <button 
                              onClick={() => startEdit(item)}
                              className="p-2 text-slate-600 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit Session"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
