# FocusFlow Copilot Instructions

## Project Overview
FocusFlow is a React+TypeScript productivity timer application with multi-timer support, Picture-in-Picture mode, and advanced history analytics. It runs entirely in the browser using localStorage for persistence and deploys to GitHub Pages via Vite.

**Stack**: React 18, TypeScript 5, Vite 7, Tailwind CSS, Lucide React icons, Document Picture-in-Picture API

## Architecture & Key Patterns

### Timer State Management
- **Single source of truth**: `App.tsx` manages all timers and history in React state
- **localStorage sync**: Timers auto-save via `useEffect` when state changes (`focusflow-timers`, `focusflow-history` keys)
- **Elapsed time calculation**: Use `getElapsed(timer)` from `utils/timeUtils.ts` — it handles both running and paused timers by computing `accumulatedMs + (now - lastStartTime)`
- **Running timers update UI at 100ms intervals** via `setInterval` in component `useEffect` hooks (see `TimerCard.tsx`, `MiniTimer.tsx`)

### Data Structures
```typescript
// Timer - represents an active or paused timer
Timer {
  id: string;                // UUID
  title: string;             // User-defined name
  createdAt: number;         // Timestamp when created
  isRunning: boolean;        // Is currently counting up
  accumulatedMs: number;     // Total elapsed when paused + before last start
  lastStartTime: number|null;// When timer was last started (null if paused)
  isMinimized: boolean;      // In floating PiP mode (render via MiniTimer, not TimerCard)
}

// HistoryItem - completed timer entry
HistoryItem {
  id: string;
  title: string;
  completedAt: number;      // Timestamp of completion
  durationMs: number;       // Final elapsed time
}
```

### Component Responsibility Breakdown
- **`App.tsx`**: Central orchestrator—manages timers, history, localStorage, demo mode, URL imports, PiP window, pagination
- **`TimerCard.tsx`**: Renders individual timer with play/pause/delete/minimize; handles title editing (editable fields)
- **`MiniTimer.tsx`**: Floating timer overlay (shown only when `timer.isMinimized === true`)
- **`HistoryView.tsx`**: Analytics dashboard with preset views (Last X days) and drill-down (Year→Month→Week→Day)
- **`TimerInput.tsx`**: Form to create new timers
- **`SyncModal.tsx`**: QR code + link sharing for exporting data via base64 URL parameters

### Critical Developer Workflows

#### Running the Project
```bash
npm install        # Install deps
npm run dev        # Start Vite dev server at http://localhost:5173
npm run build      # TypeScript check + Vite production build → dist/
npm run preview    # Test production build locally
```

#### Data Export/Import Flow
- **Export**: User clicks Share → `SyncModal` generates base64-encoded JSON (`SyncData = {timers, history, exportedAt}`)
- **Import**: URL param `?data=<base64>` triggers `useEffect` in `App.tsx` → decodes, confirms via dialog, overwrites localStorage
- **Demo Mode**: Separate `demoActiveTimers` and `demoData` state for testing without polluting real storage

#### Picture-in-Picture (PiP)
- Document PiP API via `window.documentPictureInPicture.requestWindow()`
- Creates floating window with React portal rendering
- Closed via `onclose` handler → syncs state back to main window

### Data Persistence & Edge Cases
- **Dual timer lists**: `currentTimers = demoMode ? demoActiveTimers : timers` — check mode before reading
- **Time calculation precision**: When editing a timer's elapsed time, reset `lastStartTime = Date.now()` if running (prevents time jump)
- **localStorage keys**: `'focusflow-timers'` and `'focusflow-history'` — JSON strings, cleared on import
- **History aggregation**: `HistoryView.tsx` groups items by day/week/month/year using `isSameDay/isSameMonth/isSameWeek` predicates

### Naming Conventions & Patterns
- Timer/history IDs: generated via `crypto.randomUUID()` (assumed in codebase)
- Time utilities: All timestamp math in `utils/timeUtils.ts` — use helpers like `formatTime()`, `getElapsed()`, `isSameDay()`
- Component files: PascalCase, one component per file in `components/`
- Boolean getters: `isRunning`, `isMinimized` (verbs in conditional names)

### Common Pitfalls & Solutions
1. **Timer not updating UI**: Forgot to update `elapsed` state in `useEffect`. Ensure interval dependency on `timer` object.
2. **Minimized timers showing in main view**: Add `if (timer.isMinimized) return null;` check in `TimerCard.tsx`.
3. **Data loss on demo import**: Always check `demoMode` flag before reading history/timers; demo data persists in separate state.
4. **Timestamp confusion**: All times stored as milliseconds (epoch). Use `Date.now()` for current time, not seconds.

## Build & Deployment
- **Vite config**: `base: './'` for relative asset paths (GitHub Pages requirement)
- **GitHub Actions**: `.github/workflows/deploy.yml` auto-builds and deploys on push to `main`
- **TypeScript**: Strict mode enabled; build step runs `tsc` before Vite
