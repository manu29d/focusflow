
export interface Timer {
  id: string;
  title: string;
  createdAt: number;
  isRunning: boolean;
  accumulatedMs: number;
  lastStartTime: number | null;
  isMinimized: boolean;
}

export interface HistoryItem {
  id: string;
  title: string;
  completedAt: number;
  durationMs: number;
}

export type TimerAction = 
  | { type: 'ADD_TIMER'; payload: string }
  | { type: 'DELETE_TIMER'; payload: string }
  | { type: 'COMPLETE_TIMER'; payload: string }
  | { type: 'TOGGLE_TIMER'; payload: string }
  | { type: 'MINIMIZE_TIMER'; payload: string }
  | { type: 'RESTORE_TIMER'; payload: string }
  | { type: 'UPDATE_TITLE'; payload: { id: string; title: string } }
  | { type: 'UPDATE_TIMER'; payload: { id: string; updates: Partial<Timer> } };

// Experimental Document Picture-in-Picture API types
declare global {
  interface Window {
    documentPictureInPicture: {
      requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
      window: Window | null;
      onenter: ((this: Window, ev: Event) => any) | null;
    };
  }
}
