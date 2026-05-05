import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { ViewMode } from '../types'

type WeekTransitionProps = {
  mode: ViewMode
  selectedDate: string
  children: ReactNode
}

export function WeekTransition({ mode, selectedDate, children }: WeekTransitionProps) {
  return (
    <motion.div
      className="h-full"
      key={`${mode}-${selectedDate}`}
      initial={{ opacity: 0, scale: mode === 'week' ? 0.96 : 1.02, y: mode === 'week' ? 18 : -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: mode === 'week' ? 1.03 : 0.97 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
