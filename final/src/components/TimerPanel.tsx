import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatDuration, minutesBetween } from '../utils/timeScale'

export function TimerPanel() {
  const tasks = useAppStore((state) => state.tasks)
  const activeSession = useAppStore((state) => state.activeSession)
  const selectedTaskId = useAppStore((state) => state.selectedTaskId)
  const startTimer = useAppStore((state) => state.startTimer)
  const stopTimer = useAppStore((state) => state.stopTimer)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeSession?.taskId),
    [activeSession?.taskId, tasks],
  )
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId && !task.completed),
    [selectedTaskId, tasks],
  )
  const elapsed = activeSession ? minutesBetween(activeSession.startTime, new Date(now).toISOString()) : 0
  const displayTask = activeTask ?? selectedTask
  const canStart = Boolean(selectedTask && !activeSession)

  return (
    <section className="panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="panel-kicker">Live session</p>
          <h3 className="panel-title">{displayTask ? displayTask.title : 'Select a task'}</h3>
          {!activeSession ? (
            <p className="mt-1 text-xs font-semibold text-stone-500">
              {selectedTask ? 'Ready from task list' : 'Click a task row to prepare a session'}
            </p>
          ) : null}
        </div>
        <span className="timer-readout">{formatDuration(elapsed)}</span>
      </div>

      <button
        className={`mt-4 w-full ${activeSession ? 'danger-button' : 'primary-button'}`}
        type="button"
        onClick={() => (activeSession ? stopTimer() : selectedTask && startTimer(selectedTask.id))}
        disabled={!activeSession && !canStart}
      >
        {activeSession ? <Pause size={18} /> : <Play size={18} />}
        {activeSession ? 'Stop and save session' : 'Start focus timer'}
      </button>
    </section>
  )
}
