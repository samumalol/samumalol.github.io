export type ViewMode = 'month' | 'week'
export type GroupMode = 'expanded' | 'collapsed'

export type Task = {
  id: string
  title: string
  categoryId: string
  color: string
  createdAt: string
  completed: boolean
}

export type Category = {
  id: string
  title: string
  color: string
}

export type FocusSession = {
  id: string
  taskId: string
  startTime: string
  endTime?: string
  durationMinutes: number
  date: string
}

export type ActiveSession = {
  id: string
  taskId: string
  startTime: string
}

export type HoveredBlock = {
  id: string
  taskTitle: string
  categoryTitle: string
  color: string
  date: string
  startTime: string
  endTime?: string
  durationMinutes: number
  active: boolean
}
