import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActiveSession, Category, FocusSession, GroupMode, Task, ViewMode } from '../types'
import { addDays, startOfWeek, toDateKey } from '../utils/dateUtils'
import { makeId, storageKey } from '../utils/storage'
import { minutesBetween } from '../utils/timeScale'

type DraftTask = {
  title: string
  categoryId: string
  color?: string
}

type AppState = {
  view: ViewMode
  groupMode: GroupMode
  selectedDate: string
  selectedWeekStart: string
  selectedTaskId?: string
  categories: Category[]
  tasks: Task[]
  sessions: FocusSession[]
  activeSession?: ActiveSession
  setView: (view: ViewMode) => void
  setCalendarMonth: (dateKey: string) => void
  setSelectedDate: (dateKey: string) => void
  setSelectedTask: (taskId?: string) => void
  setGroupMode: (mode: GroupMode) => void
  addTask: (task: DraftTask) => void
  updateTask: (taskId: string, updates: Partial<Pick<Task, 'title' | 'categoryId' | 'color' | 'completed'>>) => void
  deleteTask: (taskId: string) => void
  addCategory: (title: string, color: string) => void
  startTimer: (taskId: string) => void
  stopTimer: () => void
}

const palette = ['#4f8cff', '#ec6f66', '#3aa981', '#f0a33a', '#8b6fe8', '#ef5da8']

function createDemoData() {
  const today = new Date()
  const weekStart = startOfWeek(today)
  const categories: Category[] = [
    { id: 'cat-design', title: 'Design', color: '#ec6f66' },
    { id: 'cat-code', title: 'Engineering', color: '#4f8cff' },
    { id: 'cat-study', title: 'Study', color: '#3aa981' },
    { id: 'cat-admin', title: 'Admin', color: '#f0a33a' },
  ]

  const tasks: Task[] = [
    task('task-wireframes', 'Calendar interaction pass', 'cat-design', '#ec6f66', -9),
    task('task-r3f', '3D focus blocks', 'cat-code', '#4f8cff', -8),
    task('task-reading', 'Algorithm review', 'cat-study', '#3aa981', -6),
    task('task-report', 'Project write-up', 'cat-admin', '#f0a33a', -4),
    task('task-polish', 'Responsive UI polish', 'cat-design', '#ef5da8', -2),
  ]

  const sessions: FocusSession[] = [
    session('task-wireframes', addDays(weekStart, 0), '09:00', 36),
    session('task-r3f', addDays(weekStart, 0), '13:20', 74),
    session('task-reading', addDays(weekStart, 1), '10:10', 22),
    session('task-r3f', addDays(weekStart, 2), '08:45', 96),
    session('task-report', addDays(weekStart, 2), '15:00', 18),
    session('task-polish', addDays(weekStart, 3), '11:30', 42),
    session('task-reading', addDays(weekStart, 4), '09:15', 64),
    session('task-wireframes', addDays(weekStart, 4), '14:40', 28),
    session('task-report', addDays(weekStart, 5), '12:00', 33),
    session('task-polish', addDays(weekStart, 6), '16:00', 47),
    session('task-r3f', addDays(weekStart, -4), '10:30', 52),
    session('task-reading', addDays(weekStart, -3), '18:00', 25),
    session('task-report', addDays(weekStart, 8), '09:20', 44),
  ]

  return { categories, tasks, sessions }
}

function task(id: string, title: string, categoryId: string, color: string, createdOffsetDays: number): Task {
  return {
    id,
    title,
    categoryId,
    color,
    completed: false,
    createdAt: addDays(new Date(), createdOffsetDays).toISOString(),
  }
}

function session(taskId: string, date: Date, clock: string, durationMinutes: number): FocusSession {
  const [hours, minutes] = clock.split(':').map(Number)
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes)
  const end = new Date(start.getTime() + durationMinutes * 60000)
  return {
    id: makeId('session'),
    taskId,
    date: toDateKey(date),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationMinutes,
  }
}

const demo = createDemoData()
const initialDate = toDateKey(new Date())
const initialWeek = toDateKey(startOfWeek(new Date()))

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: 'month',
      groupMode: 'expanded',
      selectedDate: initialDate,
      selectedWeekStart: initialWeek,
      selectedTaskId: demo.tasks[0]?.id,
      categories: demo.categories,
      tasks: demo.tasks,
      sessions: demo.sessions,
      setView: (view) => set({ view }),
      setCalendarMonth: (dateKey) =>
        set({
          selectedDate: dateKey,
          selectedWeekStart: toDateKey(startOfWeek(new Date(`${dateKey}T00:00:00`))),
          view: 'month',
        }),
      setSelectedDate: (dateKey) =>
        set({
          selectedDate: dateKey,
          selectedWeekStart: toDateKey(startOfWeek(new Date(`${dateKey}T00:00:00`))),
          view: 'week',
        }),
      setSelectedTask: (taskId) => set({ selectedTaskId: taskId }),
      setGroupMode: (mode) => set({ groupMode: mode }),
      addTask: ({ title, categoryId, color }) =>
        set((state) => {
          const taskId = makeId('task')
          return {
            tasks: [
              ...state.tasks,
              {
                id: taskId,
                title: title.trim(),
                categoryId,
                color: color ?? state.categories.find((category) => category.id === categoryId)?.color ?? palette[0],
                createdAt: new Date().toISOString(),
                completed: false,
              },
            ],
            selectedTaskId: taskId,
          }
        }),
      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((taskItem) => (taskItem.id === taskId ? { ...taskItem, ...updates } : taskItem)),
        })),
      deleteTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((taskItem) => taskItem.id !== taskId),
          sessions: state.sessions.filter((focusSession) => focusSession.taskId !== taskId),
          activeSession: state.activeSession?.taskId === taskId ? undefined : state.activeSession,
          selectedTaskId: state.selectedTaskId === taskId ? undefined : state.selectedTaskId,
        })),
      addCategory: (title, color) =>
        set((state) => ({
          categories: [...state.categories, { id: makeId('cat'), title: title.trim(), color }],
        })),
      startTimer: (taskId) =>
        set({
          activeSession: {
            id: makeId('active'),
            taskId,
            startTime: new Date().toISOString(),
          },
        }),
      stopTimer: () => {
        const active = get().activeSession
        if (!active) {
          return
        }

        const endTime = new Date().toISOString()
        const started = new Date(active.startTime)
        const durationMinutes = Math.max(1, minutesBetween(active.startTime, endTime))
        set((state) => ({
          activeSession: undefined,
          sessions: [
            ...state.sessions,
            {
              id: active.id,
              taskId: active.taskId,
              startTime: active.startTime,
              endTime,
              durationMinutes,
              date: toDateKey(started),
            },
          ],
        }))
      },
    }),
    {
      name: storageKey,
      partialize: (state) => ({
        view: state.view,
        groupMode: state.groupMode,
        selectedDate: state.selectedDate,
        selectedWeekStart: state.selectedWeekStart,
        selectedTaskId: state.selectedTaskId,
        categories: state.categories,
        tasks: state.tasks,
        sessions: state.sessions,
        activeSession: state.activeSession,
      }),
    },
  ),
)
