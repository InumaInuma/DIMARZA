import { Html } from '@react-three/drei'
import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { SHELL_RINGS } from '../../domain/seed.ts'
import type { Piece, Section } from '../../domain/types.ts'
import { PIECE_STATE_COLORS } from '../../domain/types.ts'
import type { PieceFilter } from '../../store/selectors.ts'
import { matchesPieceFilter } from '../../store/selectors.ts'
import type { Mill3DViewSettings } from './Mill3DControls.tsx'

interface MillLinerMeshesProps {
  pieces: Piece[]
  settings: Mill3DViewSettings
  activeFilter: PieceFilter
  isMinera: boolean
  selectedPieceId: string | null
  onSelectPiece: (pieceId: string) => void
  onHoverPiece: (pieceId: string | null) => void
  onCyclePiece: (pieceId: string) => void
  onTogglePhoto: (pieceId: string) => void
}

type Vec3Tuple = [number, number, number]

function pushQuad(
  positions: number[],
  a: Vec3Tuple,
  b: Vec3Tuple,
  c: Vec3Tuple,
  d: Vec3Tuple,
): void {
  positions.push(
    a[0], a[1], a[2],
    b[0], b[1], b[2],
    c[0], c[1], c[2],
    a[0], a[1], a[2],
    c[0], c[1], c[2],
    d[0], d[1], d[2],
  )
}

function createConicalRingPlateGeometry(
  rInner: number,
  rOuter: number,
  xInner: number,
  xOuter: number,
  thicknessX: number,
  thetaSpan: number,
  arcSegments: number,
): THREE.BufferGeometry {
  const positions: number[] = []
  const halfThick = thicknessX / 2
  const startTheta = -thetaSpan / 2

  for (let i = 0; i < arcSegments; i += 1) {
    const t0 = startTheta + (i / arcSegments) * thetaSpan
    const t1 = startTheta + ((i + 1) / arcSegments) * thetaSpan
    const c0 = Math.cos(t0)
    const s0 = Math.sin(t0)
    const c1 = Math.cos(t1)
    const s1 = Math.sin(t1)

    const inL0: Vec3Tuple = [xInner - halfThick, rInner * c0, rInner * s0]
    const inL1: Vec3Tuple = [xInner - halfThick, rInner * c1, rInner * s1]
    const inR0: Vec3Tuple = [xInner + halfThick, rInner * c0, rInner * s0]
    const inR1: Vec3Tuple = [xInner + halfThick, rInner * c1, rInner * s1]

    const outL0: Vec3Tuple = [xOuter - halfThick, rOuter * c0, rOuter * s0]
    const outL1: Vec3Tuple = [xOuter - halfThick, rOuter * c1, rOuter * s1]
    const outR0: Vec3Tuple = [xOuter + halfThick, rOuter * c0, rOuter * s0]
    const outR1: Vec3Tuple = [xOuter + halfThick, rOuter * c1, rOuter * s1]

    pushQuad(positions, outL0, outR0, outR1, outL1)
    pushQuad(positions, inR0, inL0, inL1, inR1)
    pushQuad(positions, inL0, outL0, outL1, inL1)
    pushQuad(positions, outR0, inR0, inR1, outR1)

    if (i === 0) {
      pushQuad(positions, inL0, inR0, outR0, outL0)
    }
    if (i === arcSegments - 1) {
      pushQuad(positions, outL1, outR1, inR1, inL1)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}

interface CapRingSpec {
  ring: string
  count: number
  rInner: number
  rOuter: number
  xInner: number
  xOuter: number
  explodeShiftX: number
  explodeRadial: number
}

const FEED_CAP_SPECS: ReadonlyArray<CapRingSpec> = [
  {
    ring: 'OHL',
    count: 24,
    rInner: 2.38,
    rOuter: 3.16,
    xInner: -3.96,
    xOuter: -3.52,
    explodeShiftX: -1.35,
    explodeRadial: 0.48,
  },
  {
    ring: 'FMFL',
    count: 12,
    rInner: 1.62,
    rOuter: 2.32,
    xInner: -4.38,
    xOuter: -3.99,
    explodeShiftX: -1.95,
    explodeRadial: 0.34,
  },
  {
    ring: 'FIHL',
    count: 12,
    rInner: 0.92,
    rOuter: 1.56,
    xInner: -4.76,
    xOuter: -4.41,
    explodeShiftX: -2.55,
    explodeRadial: 0.22,
  },
]

const DISCHARGE_CAP_SPECS: ReadonlyArray<CapRingSpec> = [
  {
    ring: 'OHL',
    count: 24,
    rInner: 2.08,
    rOuter: 3.16,
    xInner: 4.12,
    xOuter: 3.52,
    explodeShiftX: 1.45,
    explodeRadial: 0.48,
  },
  {
    ring: 'DIHL',
    count: 12,
    rInner: 0.98,
    rOuter: 2.02,
    xInner: 4.74,
    xOuter: 4.16,
    explodeShiftX: 2.25,
    explodeRadial: 0.28,
  },
]

interface PlatePlacement {
  piece: Piece
  geometry: THREE.BufferGeometry
  position: Vec3Tuple
  rotation: Vec3Tuple
  labelPosition: Vec3Tuple
  photoMarkerPosition: Vec3Tuple
}

export default function MillLinerMeshes({
  pieces,
  settings,
  activeFilter,
  isMinera,
  selectedPieceId,
  onSelectPiece,
  onHoverPiece,
  onCyclePiece,
  onTogglePhoto,
}: MillLinerMeshesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const geometries = useMemo(() => {
    const shellTheta = (Math.PI * 2) / 28 - 0.018
    const shellGeo = createConicalRingPlateGeometry(
      2.96,
      3.2,
      0,
      0,
      0.88,
      shellTheta,
      3,
    )

    const feedGeos = new Map<string, THREE.BufferGeometry>()
    for (const spec of FEED_CAP_SPECS) {
      const span = (Math.PI * 2) / spec.count - 0.022
      feedGeos.set(
        spec.ring,
        createConicalRingPlateGeometry(
          spec.rInner,
          spec.rOuter,
          spec.xInner,
          spec.xOuter,
          0.18,
          span,
          4,
        ),
      )
    }

    const dischargeGeos = new Map<string, THREE.BufferGeometry>()
    for (const spec of DISCHARGE_CAP_SPECS) {
      const span = (Math.PI * 2) / spec.count - 0.022
      dischargeGeos.set(
        spec.ring,
        createConicalRingPlateGeometry(
          spec.rInner,
          spec.rOuter,
          spec.xInner,
          spec.xOuter,
          0.18,
          span,
          4,
        ),
      )
    }

    return {
      shellGeo,
      feedGeos,
      dischargeGeos,
    }
  }, [])

  const placements = useMemo<PlatePlacement[]>(() => {
    const result: PlatePlacement[] = []
    const shellRingIndexMap = new Map<string, number>()
    SHELL_RINGS.forEach((ring, idx) => {
      shellRingIndexMap.set(ring, idx)
    })

    const feedSpecMap = new Map<string, CapRingSpec>()
    for (const spec of FEED_CAP_SPECS) {
      feedSpecMap.set(spec.ring, spec)
    }

    const dischargeSpecMap = new Map<string, CapRingSpec>()
    for (const spec of DISCHARGE_CAP_SPECS) {
      dischargeSpecMap.set(spec.ring, spec)
    }

    for (const piece of pieces) {
      if (piece.section === 'shell') {
        const ringIdx = shellRingIndexMap.get(piece.ring) ?? 0
        const centeredIdx = ringIdx - 3
        const baseRingX = centeredIdx * 0.96
        const explodeX = settings.exploded ? centeredIdx * 0.42 : 0
        const ringX = baseRingX + explodeX

        const stepAngle = (Math.PI * 2) / 28
        const theta = (piece.index - 1) * stepAngle
        const radialOffset = settings.exploded ? 0.55 : 0
        const posY = radialOffset * Math.cos(theta)
        const posZ = radialOffset * Math.sin(theta)

        const labelR = 3.29 + radialOffset
        const photoR = 3.23 + radialOffset

        result.push({
          piece,
          geometry: geometries.shellGeo,
          position: [ringX, posY, posZ],
          rotation: [theta, 0, 0],
          labelPosition: [ringX, labelR * Math.cos(theta), labelR * Math.sin(theta)],
          photoMarkerPosition: [
            ringX + 0.25,
            photoR * Math.cos(theta + 0.04),
            photoR * Math.sin(theta + 0.04),
          ],
        })
      } else if (piece.section === 'feed') {
        const spec = feedSpecMap.get(piece.ring)
        const geo = geometries.feedGeos.get(piece.ring)
        if (!spec || !geo) {
          continue
        }
        const stepAngle = (Math.PI * 2) / spec.count
        const theta = (piece.index - 1) * stepAngle
        const shiftX = settings.exploded ? spec.explodeShiftX : 0
        const radialOffset = settings.exploded ? spec.explodeRadial : 0
        const posY = radialOffset * Math.cos(theta)
        const posZ = radialOffset * Math.sin(theta)

        const midR = (spec.rInner + spec.rOuter) / 2 + radialOffset
        const midX = (spec.xInner + spec.xOuter) / 2 + shiftX - 0.14

        result.push({
          piece,
          geometry: geo,
          position: [shiftX, posY, posZ],
          rotation: [theta, 0, 0],
          labelPosition: [midX, midR * Math.cos(theta), midR * Math.sin(theta)],
          photoMarkerPosition: [
            midX - 0.02,
            (midR + 0.12) * Math.cos(theta),
            (midR + 0.12) * Math.sin(theta),
          ],
        })
      } else {
        const spec = dischargeSpecMap.get(piece.ring)
        const geo = geometries.dischargeGeos.get(piece.ring)
        if (!spec || !geo) {
          continue
        }
        const stepAngle = (Math.PI * 2) / spec.count
        const theta = (piece.index - 1) * stepAngle
        const shiftX = settings.exploded ? spec.explodeShiftX : 0
        const radialOffset = settings.exploded ? spec.explodeRadial : 0
        const posY = radialOffset * Math.cos(theta)
        const posZ = radialOffset * Math.sin(theta)

        const midR = (spec.rInner + spec.rOuter) / 2 + radialOffset
        const midX = (spec.xInner + spec.xOuter) / 2 + shiftX + 0.14

        result.push({
          piece,
          geometry: geo,
          position: [shiftX, posY, posZ],
          rotation: [theta, 0, 0],
          labelPosition: [midX, midR * Math.cos(theta), midR * Math.sin(theta)],
          photoMarkerPosition: [
            midX + 0.02,
            (midR + 0.12) * Math.cos(theta),
            (midR + 0.12) * Math.sin(theta),
          ],
        })
      }
    }

    return result
  }, [pieces, settings.exploded, geometries])

  const shellAlpha = Math.max(0.06, 1 - settings.shellTransparency / 100)

  const shouldShowLabel = (section: Section): boolean => {
    if (section === 'shell') {
      return settings.showShellLabels
    }
    if (section === 'feed') {
      return settings.showFeedLabels
    }
    return settings.showDischargeLabels
  }

  return (
    <group>
      {placements.map((item) => {
        const { piece } = item
        const matchesFilter = matchesPieceFilter(piece.state, activeFilter)
        const isHovered = hoveredId === piece.id
        const isSelected = selectedPieceId === piece.id
        const baseColor = PIECE_STATE_COLORS[piece.state]

        let opacity = piece.section === 'shell' ? shellAlpha : 1
        if (settings.xray) {
          opacity = Math.min(opacity, 0.34)
        }
        if (!matchesFilter) {
          opacity = Math.min(opacity, 0.14)
        }

        const isTransparent = opacity < 0.99 || settings.xray
        const emissiveColor = isSelected
          ? '#0ea5e9'
          : isHovered
            ? '#ffffff'
            : settings.xray
              ? baseColor
              : '#000000'
        const emissiveIntensity = isSelected
          ? 0.45
          : isHovered
            ? 0.28
            : settings.xray
              ? 0.35
              : 0

        return (
          <group key={piece.id}>
            <mesh
              geometry={item.geometry}
              position={item.position}
              rotation={item.rotation}
              onClick={(event) => {
                event.stopPropagation()
                onSelectPiece(piece.id)
                if (!isMinera && matchesFilter) {
                  onCyclePiece(piece.id)
                }
              }}
              onContextMenu={(event) => {
                event.stopPropagation()
                event.nativeEvent.preventDefault()
                onSelectPiece(piece.id)
                if (!isMinera && matchesFilter) {
                  onTogglePhoto(piece.id)
                }
              }}
              onPointerOver={(event) => {
                event.stopPropagation()
                setHoveredId(piece.id)
                onHoverPiece(piece.id)
                if (!isMinera && matchesFilter) {
                  document.body.style.cursor = 'pointer'
                }
              }}
              onPointerOut={(event) => {
                event.stopPropagation()
                setHoveredId((prev) => (prev === piece.id ? null : prev))
                onHoverPiece(null)
                document.body.style.cursor = 'auto'
              }}
            >
              {settings.realisticShading ? (
                <meshStandardMaterial
                  color={baseColor}
                  emissive={emissiveColor}
                  emissiveIntensity={emissiveIntensity}
                  metalness={0.28}
                  roughness={0.42}
                  transparent={isTransparent}
                  opacity={opacity}
                  depthWrite={!settings.xray && opacity > 0.25}
                  wireframe={settings.wireframe}
                  side={THREE.DoubleSide}
                />
              ) : (
                <meshBasicMaterial
                  color={baseColor}
                  transparent={isTransparent}
                  opacity={opacity}
                  depthWrite={!settings.xray && opacity > 0.25}
                  wireframe={settings.wireframe}
                  side={THREE.DoubleSide}
                />
              )}
            </mesh>

            {piece.hasPhoto && matchesFilter && (
              <mesh position={item.photoMarkerPosition}>
                <sphereGeometry args={[0.055, 8, 8]} />
                <meshBasicMaterial color="#0284c7" />
              </mesh>
            )}

            {shouldShowLabel(piece.section) && matchesFilter && (
              <Html
                position={item.labelPosition}
                center
                distanceFactor={14}
                zIndexRange={[10, 0]}
              >
                <span className="pointer-events-none rounded bg-slate-900/85 px-1 py-0.5 text-[9px] font-bold whitespace-nowrap text-white shadow-2xs">
                  {piece.section === 'shell'
                    ? `${piece.ring.replace('SL ', '')}·#${piece.index}`
                    : `${piece.ring}#${piece.index}`}
                </span>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}
