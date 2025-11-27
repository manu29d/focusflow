
import { Timer, HistoryItem } from '../types';

export const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

export const formatDurationShort = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return '< 1m';
};

export const getElapsed = (timer: Timer): number => {
  if (!timer.isRunning || !timer.lastStartTime) {
    return timer.accumulatedMs;
  }
  return timer.accumulatedMs + (Date.now() - timer.lastStartTime);
};

export const getDayName = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', { weekday: 'short' });
};

export const getMonthName = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short' });
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatDateFull = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatMonthYear = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const isSameDay = (ts1: number, ts2: number): boolean => {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const isSameMonth = (ts1: number, ts2: number): boolean => {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth();
};

export const getStartOfWeek = (timestamp: number): number => {
  const d = new Date(timestamp);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setHours(0, 0, 0, 0);
  d.setDate(diff);
  return d.getTime();
};

export const getEndOfWeek = (timestamp: number): number => {
  const start = getStartOfWeek(timestamp);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
};

export const isSameWeek = (ts1: number, ts2: number): boolean => {
  return getStartOfWeek(ts1) === getStartOfWeek(ts2);
};

export const formatWeekRange = (startTs: number): string => {
  const start = new Date(startTs);
  const end = new Date(getEndOfWeek(startTs));
  
  // If same month
  if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()} - ${end.getDate()}`;
  }
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
};

// For datetime-local input (YYYY-MM-DDTHH:mm)
export const toDateTimeLocal = (timestamp: number): string => {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// --- New Helpers for Demo Data & Charting ---

export const getWeeksInMonth = (monthTimestamp: number) => {
  const d = new Date(monthTimestamp);
  d.setDate(1); // 1st of month
  const weeks = [];
  const monthIndex = d.getMonth();

  // Back up to the start of the week of the 1st
  const currentWeekStart = new Date(getStartOfWeek(d.getTime()));

  while (true) {
    // Check if any day in this week belongs to the month
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekStartInMonth = currentWeekStart.getMonth() === monthIndex && currentWeekStart.getFullYear() === d.getFullYear();
    const weekEndInMonth = weekEnd.getMonth() === monthIndex && weekEnd.getFullYear() === d.getFullYear();
    
    // If neither start nor end is in month, and we are past the start date, break
    if (!weekStartInMonth && !weekEndInMonth && currentWeekStart > d) {
       break;
    }
    
    weeks.push(currentWeekStart.getTime());
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    
    // Safety break
    if (weeks.length > 6) break;
  }
  return weeks;
};

export const generateDemoData = (): HistoryItem[] => {
  const items: HistoryItem[] = [];
  const taskTitles = [
    "Design System Update", "Client Meeting", "Code Review", 
    "Bug Fix: Navigation", "Project Planning", "Email & Comms", 
    "Deep Work: API", "Team Standup", "Documentation", "Research"
  ];
  
  const now = new Date();
  // Generate for last 365 days
  for (let i = 0; i < 365; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Skip some weekends randomly
    if (date.getDay() === 0 || date.getDay() === 6) {
      if (Math.random() > 0.3) continue;
    }

    // 1 to 5 tasks per day
    const tasksCount = Math.floor(Math.random() * 5) + 1;
    
    for (let j = 0; j < tasksCount; j++) {
      const durationMinutes = Math.floor(Math.random() * (180 - 15 + 1)) + 15; // 15m to 3h
      const durationMs = durationMinutes * 60 * 1000;
      
      // Randomize time of day
      date.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
      
      items.push({
        id: crypto.randomUUID(),
        title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
        completedAt: date.getTime(),
        durationMs
      });
    }
  }
  return items;
};

export const generateDemoActiveTimers = (): Timer[] => {
  const timers: Timer[] = [];
  const titles = ["Q4 Report", "Refactoring Auth", "Design Sprint", "Customer Support"];
  
  // Create 1 running timer
  timers.push({
    id: crypto.randomUUID(),
    title: titles[0],
    createdAt: Date.now() - 3600000,
    isRunning: true,
    accumulatedMs: 45 * 60 * 1000,
    lastStartTime: Date.now(),
    isMinimized: false
  });

  // Create random paused timers
  for (let i = 1; i < titles.length; i++) {
    timers.push({
      id: crypto.randomUUID(),
      title: titles[i],
      createdAt: Date.now() - Math.random() * 86400000,
      isRunning: false,
      accumulatedMs: Math.floor(Math.random() * 120) * 60 * 1000,
      lastStartTime: null,
      isMinimized: false
    });
  }
  return timers;
};
