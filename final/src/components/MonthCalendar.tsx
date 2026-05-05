import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { fromDateKey, getMonthGrid, isSameDateKey, monthLabel, sameMonth, toDateKey } from '../utils/dateUtils'
import { formatDuration } from '../utils/timeScale'

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function MonthCalendar() {
  const selectedDate = useAppStore((state) => state.selectedDate)
  const sessions = useAppStore((state) => state.sessions)
  const tasks = useAppStore((state) => state.tasks)
  const setSelectedDate = useAppStore((state) => state.setSelectedDate)
  const setCalendarMonth = useAppStore((state) => state.setCalendarMonth)
  const activeSession = useAppStore((state) => state.activeSession)
  const monthDays = useMemo(() => getMonthGrid(selectedDate), [selectedDate])
  const selectedMonth = fromDateKey(selectedDate)
  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, typeof sessions>()
    sessions.forEach((session) => {
      grouped.set(session.date, [...(grouped.get(session.date) ?? []), session])
    })
    return grouped
  }, [sessions])

  const activeTask = tasks.find((task) => task.id === activeSession?.taskId)
  const todayKey = toDateKey(new Date())

  function changeMonth(direction: number) {
    const current = fromDateKey(selectedDate)
    setCalendarMonth(toDateKey(new Date(current.getFullYear(), current.getMonth() + direction, 1)))
  }

  return (
    <motion.section
      className="flex h-full flex-col p-4 lg:p-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="panel-kicker">Monthly overview</p>
          <h2 className="text-2xl font-semibold text-stone-950">{monthLabel(selectedDate)}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="icon-button" type="button" onClick={() => changeMonth(-1)} title="Previous month">
            <ChevronLeft size={18} />
          </button>
          <button className="app-button" type="button" onClick={() => setCalendarMonth(todayKey)}>
            Today
          </button>
          <button className="icon-button" type="button" onClick={() => changeMonth(1)} title="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="calendar-shell">
        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-100/80">
          {weekdays.map((day) => (
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500" key={day}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-7">
          {monthDays.map((day, index) => {
            const dateKey = toDateKey(day)
            const daySessions = sessionsByDate.get(dateKey) ?? []
            const dayTotal = daySessions.reduce((sum, session) => sum + session.durationMinutes, 0)
            const isCurrentMonth = sameMonth(day, selectedMonth)
            const selected = isSameDateKey(day, selectedDate)
            return (
              <motion.button
                className={`calendar-cell ${!isCurrentMonth ? 'muted' : ''} ${selected ? 'selected' : ''}`}
                type="button"
                key={`${dateKey}-${index}`}
                onClick={() => setSelectedDate(dateKey)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={dateKey === todayKey ? 'today-dot' : ''}>{day.getDate()}</span>
                  {dayTotal > 0 ? <span className="text-[11px] text-stone-500">{formatDuration(dayTotal)}</span> : null}
                </span>
                <span className="mt-auto grid gap-1">
                  {daySessions.slice(0, 4).map((session) => {
                    const task = tasks.find((item) => item.id === session.taskId)
                    return (
                      <span className="mini-session" key={session.id} style={{ backgroundColor: task?.color ?? '#78716c' }}>
                        {task?.title ?? 'Focus'}
                      </span>
                    )
                  })}
                  {activeTask && dateKey === todayKey ? (
                    <span className="mini-session live" style={{ backgroundColor: activeTask.color }}>
                      Live now
                    </span>
                  ) : null}
                  {daySessions.length > 4 ? <span className="text-left text-[11px] text-stone-500">+{daySessions.length - 4} more</span> : null}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 text-sm text-stone-500">
        Click any day to expand its week into the axonometric focus model.
      </div>
    </motion.section>
  )
}
