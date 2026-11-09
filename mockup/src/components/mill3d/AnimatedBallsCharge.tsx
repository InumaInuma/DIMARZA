import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

interface AnimatedBallsChargeProps {
  enabled: boolean
  realisticShading: boolean
  wireframe: boolean
}

interface BallSeed {
  x: number
  baseAngle: number
  radiusTier: number
  speed: number
  phase: number
  scale: number
}

const BALL_COUNT = 126

function createBallSeeds(): BallSeed[] {
  const seeds: BallSeed[] = []
  for (let i = 0; i < BALL_COUNT; i += 1) {
    const lane = (i % 14) / 13
    const x = -2.85 + lane * 5.7 + ((i * 17) % 7) * 0.04
    const layer = i % 3
    const radiusTier = 2.66 - layer * 0.23
    const baseAngle = Math.PI + ((i * 29) % 100) / 100 - 0.35
    const speed = 1.35 + (i % 5) * 0.18
    const phase = (i * 0.47) % (Math.PI * 2)
    const scale = 0.125 + (i % 3) * 0.018
    seeds.push({ x, baseAngle, radiusTier, speed, phase, scale })
  }
  return seeds
}

export default function AnimatedBallsCharge({
  enabled,
  realisticShading,
  wireframe,
}: AnimatedBallsChargeProps) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null)
  const seeds = useMemo(() => createBallSeeds(), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) {
      return
    }
    const t = enabled ? clock.getElapsedTime() : 0

    for (let i = 0; i < seeds.length; i += 1) {
      const seed = seeds[i]
      const cycle = (t * seed.speed + seed.phase) % (Math.PI * 2)
      const swing = Math.sin(cycle) * 0.62
      const cascadeLift = Math.max(0, Math.cos(cycle)) * 0.22
      const theta = seed.baseAngle + swing
      const r = seed.radiusTier - cascadeLift

      const y = r * Math.cos(theta)
      const z = r * Math.sin(theta)
      const axialOsc = Math.sin(t * 1.8 + seed.phase) * 0.06

      dummy.position.set(seed.x + axialOsc, y, z)
      dummy.rotation.set(t * 2.2 + seed.phase, t * 1.5, 0)
      dummy.scale.setScalar(seed.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BALL_COUNT]}>
      <sphereGeometry args={[1, 12, 12]} />
      {realisticShading ? (
        <meshStandardMaterial
          color="#475569"
          metalness={0.75}
          roughness={0.28}
          wireframe={wireframe}
        />
      ) : (
        <meshBasicMaterial color="#64748b" wireframe={wireframe} />
      )}
    </instancedMesh>
  )
}
