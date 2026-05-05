import { formatClock, formatDuration } from '../utils/timeScale'
import type { HoveredBlock } from '../types'

export function BlockTooltip({ block }: { block: HoveredBlock }) {
  return (
    <div className="block-tooltip">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: block.color }} />
        <strong>{block.taskTitle}</strong>
      </div>
      <dl>
        <div>
          <dt>Date</dt>
          <dd>{block.date}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>
            {formatClock(block.startTime)}
            {block.endTime ? ` - ${formatClock(block.endTime)}` : ' - running'}
          </dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>
            {formatDuration(block.durationMinutes)}
            {block.active ? ' live' : ''}
          </dd>
        </div>
      </dl>
    </div>
  )
}
