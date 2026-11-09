import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import type { CameraPreset } from './Mill3DControls.tsx'

interface MillCameraRigProps {
  preset: CameraPreset
  trigger: number
  autoRotate: boolean
  exploded: boolean
}

interface CameraPose {
  position: [number, number, number]
  target: [number, number, number]
}

const CAMERA_POSES: Record<CameraPreset, CameraPose> = {
  isometric: {
    position: [9.8, 6.2, 10.8],
    target: [0, 0, 0],
  },
  lateral: {
    position: [0, 0.6, 13.8],
    target: [0, 0, 0],
  },
  feed: {
    position: [-14.2, 0.4, 0.01],
    target: [-3.2, 0, 0],
  },
  discharge: {
    position: [14.2, 0.4, 0.01],
    target: [3.2, 0, 0],
  },
  top: {
    position: [0, 14.8, 0.01],
    target: [0, 0, 0],
  },
  interior: {
    position: [-0.9, 0.25, 0.35],
    target: [3.2, -0.15, 0],
  },
}

export default function MillCameraRig({
  preset,
  trigger,
  autoRotate,
  exploded,
}: MillCameraRigProps) {
  const camera = useThree((s) => s.camera)
  const pose = CAMERA_POSES[preset]
  const scale = exploded && preset !== 'interior' ? 1.22 : 1

  const posX = pose.position[0] * scale
  const posY = pose.position[1] * scale
  const posZ = pose.position[2] * scale

  useEffect(() => {
    camera.position.set(posX, posY, posZ)
    camera.lookAt(pose.target[0], pose.target[1], pose.target[2])
    camera.updateProjectionMatrix()
  }, [camera, posX, posY, posZ, pose.target, preset, trigger])

  return (
    <OrbitControls
      key={`${preset}-${trigger}`}
      makeDefault
      target={pose.target}
      autoRotate={autoRotate}
      autoRotateSpeed={1.4}
      enableDamping
      dampingFactor={0.08}
      minDistance={preset === 'interior' ? 0.2 : 2.5}
      maxDistance={32}
    />
  )
}
