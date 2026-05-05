import { AnimatePresence } from 'framer-motion'
import { CalendarDays, Cuboid, ListTodo } from 'lucide-react'
import { Layout } from './components/Layout'
import { MonthCalendar } from './components/MonthCalendar'
import { Sidebar } from './components/Sidebar'
import { TaskList } from './components/TaskList'
import { TimerPanel } from './components/TimerPanel'
import { ViewToggle } from './components/ViewToggle'
import { WeekTransition } from './components/WeekTransition'
import { WeeklyAxonView } from './components/WeeklyAxonView'
import { useAppStore } from './store/useAppStore'

export default function App() {
  const view = useAppStore((state) => state.view)
  const selectedDate = useAppStore((state) => state.selectedDate)
  const selectedWeekStart = useAppStore((state) => state.selectedWeekStart)
  const setView = useAppStore((state) => state.setView)

  return (
    <Layout
      sidebar={
        <Sidebar>
          <TimerPanel />
          <TaskList />
        </Sidebar>
      }
    >
      <header className="flex flex-col gap-4 border-b border-stone-200 bg-white/85 px-4 py-4 backdrop-blur lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              <Cuboid size={15} />
              Axon Focus Calendar
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-stone-950 md:text-3xl">
              Focus time as architectural massing
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="app-button"
              type="button"
              onClick={() => setView('month')}
              title="Open monthly calendar"
            >
              <CalendarDays size={17} />
              Month
            </button>
            <button
              className="app-button app-button-dark"
              type="button"
              onClick={() => setView('week')}
              title="Open weekly axonometric view"
            >
              <ListTodo size={17} />
              Week 3D
            </button>
            <ViewToggle />
          </div>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden bg-stone-50">
        <WeekTransition mode={view} selectedDate={selectedDate}>
          <AnimatePresence mode="wait">
            {view === 'month' ? (
              <MonthCalendar key="month" />
            ) : (
              <WeeklyAxonView key="week" weekStart={selectedWeekStart} />
            )}
          </AnimatePresence>
        </WeekTransition>
      </main>
    </Layout>
  )
}
