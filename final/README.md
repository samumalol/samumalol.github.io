# Axon Focus Calendar

A polished MVP for a 3D to-do and focus-tracking calendar app. The app combines a standard monthly calendar with an axonometric weekly 3D model where focus sessions become stacked architectural blocks.

## Tech Stack

- React
- TypeScript
- Vite
- React Three Fiber
- Three.js
- Zustand
- Framer Motion
- Tailwind CSS
- localStorage persistence

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

For a production build:

```bash
npm run build
```

## Features

- Create, edit, complete, and delete tasks.
- Assign tasks to color-coded categories.
- Start and stop a live focus timer.
- Persist tasks, sessions, selected view, and timer state in localStorage.
- Monthly calendar with colored daily session indicators.
- Click any day to enter the weekly 3D axonometric view.
- Weekly 3D view maps:
  - X-axis to Monday through Sunday.
  - Y-axis to tasks or categories.
  - Z-axis to focused time.
- Toggle between expanded task rows and a collapsed daily stack.
- Stack every session in the same day into one cumulative vertical day mass.
- Preserve individual task colors when rows are collapsed into one daily stack.
- Show a live growing block while the timer is running.
- Hover or click 3D blocks to inspect task, category, date, time range, and exact duration.
- Includes sample demo data on first load.
- Responsive layout for desktop and smaller screens.

## Implementation Decisions

The app intentionally has no backend. Zustand owns the application state and persists the useful state subset through localStorage, so the MVP stays easy to run and reset.

The 3D scene uses an orthographic camera with a fixed axonometric angle. The model maps app coordinates into Three.js coordinates by using Three.js `x` for days, Three.js `z` for task/category rows, and Three.js `y` for vertical focus duration. This keeps the visual result aligned with the requested X/Y/Z concept while using Three.js' normal vertical axis.

Focus duration uses non-linear scaling:

```ts
visualHeight = 0.6 * Math.log1p(durationMinutes)
```

That keeps long sessions readable. A 20-minute session is visibly meaningful, while longer sessions compress visually without losing their exact duration in labels and tooltips.

The monthly-to-weekly transition is approximated with Framer Motion: the calendar view zooms/fades out, then the weekly canvas fades and slides in. The 3D blocks animate upward inside the scene so the transition feels like the weekly massing model is being assembled.

## File Structure

```text
src/
  main.tsx
  App.tsx
  styles.css
  store/
    useAppStore.ts
  types/
    index.ts
  utils/
    dateUtils.ts
    timeScale.ts
    storage.ts
  components/
    Layout.tsx
    Sidebar.tsx
    TaskList.tsx
    TimerPanel.tsx
    MonthCalendar.tsx
    WeekTransition.tsx
    WeeklyAxonView.tsx
    FocusBlock.tsx
    BlockTooltip.tsx
    ViewToggle.tsx
```
