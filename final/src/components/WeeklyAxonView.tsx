import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls, Text } from '@react-three/drei'
import { motion } from 'framer-motion'
import { ChevronLeft, CalendarDays } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BlockTooltip } from './BlockTooltip'
import { FocusBlock, type FocusBlockData } from './FocusBlock'
import { useAppStore } from '../store/useAppStore'
import type { HoveredBlock } from '../types'
import { dateRangeLabel, diffDays, fromDateKey, getWeekDays, toDateKey } from '../utils/dateUtils'
import { durationToHeight, formatDuration, minutesBetween } from '../utils/timeScale'

type WeeklyAxonViewProps = {
  weekStart: string
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const collapsedRowId = 'collapsed-daily-stack'
const lockedPolarAngle = Math.PI / 3

type RenderSession = {
  id: string
  taskId: string
  date: string
  startTime: string
  endTime?: string
  durationMinutes: number
  active: boolean
}

export function WeeklyAxonView({ weekStart }: WeeklyAxonViewProps) {
  const tasks = useAppStore((state) => state.tasks)
  const categories = useAppStore((state) => state.categories)
  const sessions = useAppStore((state) => state.sessions)
  const groupMode = useAppStore((state) => state.groupMode)
  const activeSession = useAppStore((state) => state.activeSession)
  const setView = useAppStore((state) => state.setView)
  const [hoveredBlock, setHoveredBlock] = useState<HoveredBlock | undefined>()
  const [inspectedBlock, setInspectedBlock] = useState<HoveredBlock | undefined>()
  const [now, setNow] = useState(() => Date.now())
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1200 : window.innerWidth,
  )

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
  const rows = useMemo(() => {
    if (groupMode === 'collapsed') {
      return [{ id: collapsedRowId, label: 'Daily focus stack', color: '#78716c' }]
    }
    return tasks.map((task) => ({ id: task.id, label: task.title, color: task.color }))
  }, [groupMode, tasks])

  const blocks = useMemo(() => {
    const weekStartDate = fromDateKey(weekStart)
    const rowLookup = new Map(rows.map((row, index) => [row.id, index]))
    const stackHeights = new Map<string, number>()
    const activeDate = activeSession ? toDateKey(new Date(activeSession.startTime)) : ''
    const activeTask = tasks.find((task) => task.id === activeSession?.taskId)
    const weeklySessions = sessions.filter((session) => {
      const dayIndex = diffDays(fromDateKey(session.date), weekStartDate)
      return dayIndex >= 0 && dayIndex < 7
    })

    const liveSession: RenderSession[] =
      activeSession && activeTask
        ? [
            {
              id: activeSession.id,
              taskId: activeSession.taskId,
              date: activeDate,
              startTime: activeSession.startTime,
              durationMinutes: minutesBetween(activeSession.startTime, new Date(now).toISOString()),
              active: true,
            },
          ]
        : []

    return [...weeklySessions.map((session): RenderSession => ({ ...session, active: false })), ...liveSession]
      .filter((session) => {
        const dayIndex = diffDays(fromDateKey(session.date), weekStartDate)
        return dayIndex >= 0 && dayIndex < 7
      })
      .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())
      .flatMap((session) => {
        const task = tasks.find((taskItem) => taskItem.id === session.taskId)
        if (!task) {
          return []
        }
        const category = categories.find((categoryItem) => categoryItem.id === task.categoryId)
        const rowId = groupMode === 'collapsed' ? collapsedRowId : task.id
        const row = rowLookup.get(rowId)
        if (row === undefined) {
          return []
        }
        const dayIndex = diffDays(fromDateKey(session.date), weekStartDate)
        const key = groupMode === 'collapsed' ? `${dayIndex}` : `${dayIndex}-${row}`
        const previousHeight = stackHeights.get(key) ?? 0
        const height = Math.max(0.22, durationToHeight(session.durationMinutes))
        stackHeights.set(key, previousHeight + height + 0.05)

        return [
          {
            id: session.id,
            x: dayIndex,
            row,
            height,
            zOffset: previousHeight,
            taskTitle: task.title,
            categoryTitle: category?.title ?? 'Uncategorized',
            color: task.color,
            date: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
            durationMinutes: session.durationMinutes,
            active: session.active,
          } satisfies FocusBlockData,
        ]
      })
  }, [activeSession, categories, groupMode, now, rows, sessions, tasks, weekStart])

  const maxStackHeight = useMemo(
    () => blocks.reduce((tallest, block) => Math.max(tallest, block.zOffset + block.height), 0),
    [blocks],
  )
  const sceneWidth = 7 * 1.35
  const sceneDepth = Math.max(4, rows.length * 1.08)
  const centeredX = -sceneWidth / 2 + 0.8
  const centeredZ = -sceneDepth / 2 + 0.7
  const baseCameraZoom = viewportWidth < 520 ? 42 : viewportWidth < 850 ? 56 : 84
  const heightFitRatio = Math.min(1, Math.max(0.5, 3.6 / Math.max(maxStackHeight, 3.6)))
  const cameraZoom = baseCameraZoom * heightFitRatio
  const rowLabelX = viewportWidth < 520 ? -0.25 : -1.15

  return (
    <motion.section
      className="flex h-full flex-col"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex flex-col gap-3 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-between lg:px-6">
        <div>
          <p className="panel-kicker">Weekly axonometric model</p>
          <h2 className="text-xl font-semibold text-stone-950">{dateRangeLabel(weekStart)}</h2>
        </div>
        <button className="app-button" type="button" onClick={() => setView('month')}>
          <ChevronLeft size={17} />
          Back to month
        </button>
      </div>

      <div className="relative min-h-[560px] flex-1 bg-[#ece9e1]">
        <Canvas
          shadows
          orthographic
          camera={{ position: [7.5, 7, 8.5], zoom: cameraZoom, near: 0.1, far: 100 }}
          dpr={[1, 2]}
          gl={{ preserveDrawingBuffer: true }}
          onPointerMissed={() => setInspectedBlock(undefined)}
        >
          <color attach="background" args={['#ece9e1']} />
          <ambientLight intensity={1.7} />
          <directionalLight position={[5, 9, 4]} intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} />
          <group position={[centeredX, 0, centeredZ]} rotation={[0, -0.08, 0]}>
            <SceneBase rowCount={rows.length} />
            {weekDays.map((day, index) => (
              <Html key={toDateKey(day)} position={[index * 1.35, 0.05, -0.95]} center>
                <div className="axis-label">
                  <strong>{dayLabels[index]}</strong>
                  <span>{day.getDate()}</span>
                </div>
              </Html>
            ))}
            {groupMode === 'expanded'
              ? rows.map((row, index) => (
                  <Html key={row.id} position={[rowLabelX, 0.05, index * 1.08]} center>
                    <div className="row-label">
                      <span style={{ backgroundColor: row.color }} />
                      {row.label}
                    </div>
                  </Html>
                ))
              : null}
            <DurationScale />
            {blocks.map((block) => (
              <FocusBlock
                block={block}
                key={block.id}
                onHover={setHoveredBlock}
                onInspect={setInspectedBlock}
              />
            ))}
            <Text position={[3.8, 0.02, sceneDepth + 0.2]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.18} color="#57534e">
              {groupMode === 'collapsed'
                ? 'X: days     color: task     Z: stacked focus time'
                : 'X: days     Y: tasks     Z: compressed focus time'}
            </Text>
          </group>
          <OrbitControls
            enablePan={false}
            enableZoom
            enableRotate
            minPolarAngle={lockedPolarAngle}
            maxPolarAngle={lockedPolarAngle}
            minZoom={45}
            maxZoom={120}
          />
        </Canvas>

        {blocks.length === 0 ? (
          <div className="empty-scene">
            <CalendarDays size={24} />
            No focus sessions in this week yet.
          </div>
        ) : null}
        {hoveredBlock || inspectedBlock ? (
          <div className="scene-tooltip">
            <BlockTooltip block={(hoveredBlock ?? inspectedBlock)!} />
          </div>
        ) : null}
      </div>
    </motion.section>
  )
}

function SceneBase({ rowCount }: { rowCount: number }) {
  const depth = Math.max(4, rowCount * 1.08)
  return (
    <>
      <mesh receiveShadow position={[4.05, -0.025, depth / 2 - 0.55]}>
        <boxGeometry args={[10.6, 0.05, depth + 1.8]} />
        <meshStandardMaterial color="#f7f3ea" roughness={0.82} />
      </mesh>
      <gridHelper args={[11, 22, '#cfc8ba', '#ded7cb']} position={[4.05, 0.01, depth / 2 - 0.55]} />
    </>
  )
}

function DurationScale() {
  const marks = [20, 60, 120]
  return (
    <group position={[-0.78, 0, -0.72]}>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[0.03, 3.2, 0.03]} />
        <meshBasicMaterial color="#a8a29e" />
      </mesh>
      {marks.map((minutes) => {
        const height = durationToHeight(minutes)
        return (
          <group key={minutes} position={[0, height, 0]}>
            <mesh position={[0.16, 0, 0]}>
              <boxGeometry args={[0.32, 0.02, 0.02]} />
              <meshBasicMaterial color="#a8a29e" />
            </mesh>
            <Html position={[-0.35, 0, 0]} center>
              <span className="scale-label">{formatDuration(minutes)}</span>
            </Html>
          </group>
        )
      })}
    </group>
  )
}
