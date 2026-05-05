import { RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import type { HoveredBlock } from '../types'

export type FocusBlockData = HoveredBlock & {
  x: number
  row: number
  height: number
  zOffset: number
}

type FocusBlockProps = {
  block: FocusBlockData
  onHover: (block?: HoveredBlock) => void
  onInspect: (block: HoveredBlock) => void
}

export function FocusBlock({ block, onHover, onInspect }: FocusBlockProps) {
  const position: [number, number, number] = [block.x * 1.35, block.zOffset + block.height / 2, block.row * 1.08]
  const groupRef = useRef<Group>(null)
  const material = useMemo(
    () => ({
      color: block.color,
      roughness: 0.72,
      metalness: 0.04,
      emissive: block.active ? block.color : '#000000',
      emissiveIntensity: block.active ? 0.12 : 0,
    }),
    [block.active, block.color],
  )

  function handlePointer(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation()
    onHover(block)
  }

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    onInspect(block)
  }

  useFrame(() => {
    if (!groupRef.current) {
      return
    }
    groupRef.current.scale.y += (1 - groupRef.current.scale.y) * 0.12
    groupRef.current.position.y += (position[1] - groupRef.current.position.y) * 0.12
  })

  return (
    <group
      ref={groupRef}
      position={[position[0], block.zOffset, position[2]]}
      scale={[1, 0.01, 1]}
      onPointerOver={handlePointer}
      onPointerMove={handlePointer}
      onPointerOut={() => onHover(undefined)}
      onClick={handleClick}
    >
      <RoundedBox args={[0.82, block.height, 0.82]} radius={0.035} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial {...material} />
      </RoundedBox>
      <mesh position={[0.08, block.height / 2 + 0.012, -0.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.62, 0.62]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={block.active ? 0.2 : 0.12} />
      </mesh>
    </group>
  )
}
