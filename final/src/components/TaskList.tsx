import { Check, Pencil, Play, Plus, Square, Trash2, X } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useAppStore } from '../store/useAppStore'

const defaultTaskColors = [
  '#ec6f66',
  '#4f8cff',
  '#3aa981',
  '#f0a33a',
  '#8b6fe8',
  '#ef5da8',
  '#00a6a6',
  '#c084fc',
  '#84cc16',
  '#f97316',
  '#06b6d4',
  '#e11d48',
]

function chooseDistinctColor(existingColors: string[]): string {
  const used = existingColors.map(hexToRgb).filter((color): color is [number, number, number] => Boolean(color))
  const scored = defaultTaskColors.map((color) => {
    const rgb = hexToRgb(color)
    const distance = rgb && used.length > 0 ? Math.min(...used.map((usedColor) => colorDistance(rgb, usedColor))) : Infinity
    return { color, distance }
  })

  return scored.sort((left, right) => right.distance - left.distance)[0]?.color ?? defaultTaskColors[0]
}

function hexToRgb(color: string): [number, number, number] | undefined {
  const normalized = color.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return undefined
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ]
}

function colorDistance(left: [number, number, number], right: [number, number, number]): number {
  return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2])
}

export function TaskList() {
  const tasks = useAppStore((state) => state.tasks)
  const categories = useAppStore((state) => state.categories)
  const addTask = useAppStore((state) => state.addTask)
  const updateTask = useAppStore((state) => state.updateTask)
  const deleteTask = useAppStore((state) => state.deleteTask)
  const activeSession = useAppStore((state) => state.activeSession)
  const selectedTaskId = useAppStore((state) => state.selectedTaskId)
  const setSelectedTask = useAppStore((state) => state.setSelectedTask)
  const startTimer = useAppStore((state) => state.startTimer)
  const stopTimer = useAppStore((state) => state.stopTimer)
  const [title, setTitle] = useState('')
  const [newTaskColor, setNewTaskColor] = useState(() => chooseDistinctColor(tasks.map((task) => task.color)))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingColor, setEditingColor] = useState(defaultTaskColors[0])

  const activeTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks])
  const fallbackCategoryId = categories[0]?.id ?? 'cat-design'

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      return
    }
    addTask({ title, categoryId: fallbackCategoryId, color: newTaskColor })
    setTitle('')
    setNewTaskColor(chooseDistinctColor([...tasks.map((task) => task.color), newTaskColor]))
  }

  function beginEdit(taskId: string, currentTitle: string, currentColor: string) {
    setEditingId(taskId)
    setEditingTitle(currentTitle)
    setEditingColor(currentColor)
  }

  function saveEdit() {
    if (editingId && editingTitle.trim()) {
      updateTask(editingId, {
        title: editingTitle.trim(),
        color: editingColor,
      })
    }
    setEditingId(null)
  }

  function handleTimerClick(taskId: string) {
    setSelectedTask(taskId)
    if (activeSession?.taskId === taskId) {
      stopTimer()
      return
    }
    startTimer(taskId)
  }

  return (
    <section className="panel flex-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="panel-kicker">Task rows</p>
          <h3 className="panel-title">Backlog</h3>
        </div>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
          {activeTasks.length}
        </span>
      </div>

      <form className="mt-4 grid gap-2" onSubmit={handleAdd}>
        <input
          className="field"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New task"
          aria-label="New task title"
        />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <label className="color-picker-field">
            <span>Color</span>
            <input
              type="color"
              value={newTaskColor}
              onChange={(event) => setNewTaskColor(event.target.value)}
              aria-label="New task color"
            />
            <strong>{newTaskColor}</strong>
          </label>
          <button className="icon-button icon-button-dark" type="submit" title="Add task">
            <Plus size={18} />
          </button>
        </div>
      </form>

      <div className="mt-4 grid gap-2">
        {tasks.map((task) => {
          const isEditing = editingId === task.id
          const isSelected = selectedTaskId === task.id && !activeSession
          const isActive = activeSession?.taskId === task.id
          return (
            <article
              aria-pressed={isSelected || isActive}
              className={`task-row ${isSelected ? 'selected' : ''} ${isActive ? 'active-session-row' : ''} ${task.completed ? 'opacity-50' : ''}`}
              key={task.id}
              onClick={() => {
                if (!isEditing) {
                  setSelectedTask(task.id)
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (!isEditing && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault()
                  setSelectedTask(task.id)
                }
              }}
            >
              <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: task.color }} />
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <div className="grid gap-2">
                    <input
                      className="field compact-field"
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') saveEdit()
                        if (event.key === 'Escape') setEditingId(null)
                      }}
                      aria-label="Edit task title"
                      autoFocus
                    />
                    <label className="color-picker-field">
                      <span>Color</span>
                      <input
                        type="color"
                        value={editingColor}
                        onChange={(event) => setEditingColor(event.target.value)}
                        aria-label="Edit task color"
                      />
                      <strong>{editingColor}</strong>
                    </label>
                  </div>
                ) : (
                  <p className="truncate text-sm font-semibold text-stone-900">{task.title}</p>
                )}
                {isEditing ? <p className="mt-0.5 truncate text-xs text-stone-500">{editingColor.toUpperCase()}</p> : null}
              </div>
              <div className="task-actions" onClick={(event) => event.stopPropagation()}>
                {isEditing ? (
                  <>
                    <button className="mini-button" type="button" onClick={saveEdit} title="Save">
                      <Check size={15} />
                    </button>
                    <button className="mini-button" type="button" onClick={() => setEditingId(null)} title="Cancel">
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`mini-button ${activeSession?.taskId === task.id ? 'active-timer-button' : ''}`}
                      type="button"
                      onClick={() => handleTimerClick(task.id)}
                      title={activeSession?.taskId === task.id ? 'Stop timer' : 'Start timer'}
                      disabled={Boolean(activeSession && activeSession.taskId !== task.id)}
                    >
                      {activeSession?.taskId === task.id ? <Square size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      className="mini-button"
                      type="button"
                      onClick={() => updateTask(task.id, { completed: !task.completed })}
                      title={task.completed ? 'Mark active' : 'Mark complete'}
                    >
                      <Check size={15} />
                    </button>
                    <button
                      className="mini-button"
                      type="button"
                      onClick={() => beginEdit(task.id, task.title, task.color)}
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button className="mini-button" type="button" onClick={() => deleteTask(task.id)} title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
