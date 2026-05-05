import { Blocks, Layers3 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export function ViewToggle() {
  const groupMode = useAppStore((state) => state.groupMode)
  const setGroupMode = useAppStore((state) => state.setGroupMode)

  return (
    <div className="segmented-control" aria-label="Grouping mode">
      <button
        className={groupMode === 'expanded' ? 'active' : ''}
        type="button"
        onClick={() => setGroupMode('expanded')}
        title="Expanded by task"
      >
        <Blocks size={16} />
        Expanded by task
      </button>
      <button
        className={groupMode === 'collapsed' ? 'active' : ''}
        type="button"
        onClick={() => setGroupMode('collapsed')}
        title="Collapsed daily stack"
      >
        <Layers3 size={16} />
        Collapsed stack
      </button>
    </div>
  )
}
