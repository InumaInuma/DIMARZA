import { Canvas } from '@react-three/fiber'
import { Camera, Compass, Lock } from 'lucide-react'
import type { Piece } from '../../domain/types.ts'
import { PIECE_STATE_COLORS, PIECE_STATE_LABELS } from '../../domain/types.ts'
import type { PieceFilter } from '../../store/selectors.ts'
import AnimatedBallsCharge from './AnimatedBallsCharge.tsx'
import type { CameraPreset, Mill3DViewSettings } from './Mill3DControls.tsx'
import MillCameraRig from './MillCameraRig.tsx'
import MillLinerMeshes from './MillLinerMeshes.tsx'

interface Mill3DCanvasProps {
  millCode: string
  millName: string
  pieces: Piece[]
  settings: Mill3DViewSettings
  activeFilter: PieceFilter
  isMinera: boolean
  selectedPieceId: string | null
  hoveredPiece: Piece | null
  onSelectPiece: (pieceId: string) => void
  onHoverPiece: (pieceId: string | null) => void
  onCyclePiece: (pieceId: string) => void
  onTogglePhoto: (pieceId: string) => void
}

const CAMERA_LABELS: Record<CameraPreset, string> = {
  isometric: 'Isométrica',
  lateral: 'Lateral',
  feed: 'Tapa alimentación',
  discharge: 'Tapa descarga',
  top: 'Superior',
  interior: 'Interior del molino',
}

export default function Mill3DCanvas({
  millCode,
  millName,
  pieces,
  settings,
  activeFilter,
  isMinera,
  selectedPieceId,
  hoveredPiece,
  onSelectPiece,
  onHoverPiece,
  onCyclePiece,
  onTogglePhoto,
}: Mill3DCanvasProps) {
  const trunnionShift = settings.exploded ? 2.75 : 0

  return (
    <div className="relative h-[540px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-xs">
      <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/85 px-3 py-1.5 text-xs font-bold text-slate-100 backdrop-blur-xs">
          <Compass className="h-3.5 w-3.5 text-sky-400" />
          <span>
            {millCode} · Vista: {CAMERA_LABELS[settings.cameraPreset]}
          </span>
        </span>

        {settings.exploded && (
          <span className="rounded-lg border border-indigo-500/40 bg-indigo-950/85 px-2.5 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-xs">
            Modo explotado activo
          </span>
        )}

        {settings.xray && (
          <span className="rounded-lg border border-cyan-500/40 bg-cyan-950/85 px-2.5 py-1 text-xs font-semibold text-cyan-200 backdrop-blur-xs">
            Modo X-Ray
          </span>
        )}
      </div>

      <div className="pointer-events-none absolute top-3 right-3 z-10 flex items-center gap-2">
        {isMinera ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/85 px-3 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur-xs">
            <Lock className="h-3.5 w-3.5" />
            <span>Rol Minera · Solo lectura</span>
          </span>
        ) : (
          <span className="rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur-xs">
            Clic izq: cambiar estado · Clic der: foto · Arrastrar: orbitar
          </span>
        )}
      </div>

      {hoveredPiece && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs text-white shadow-lg backdrop-blur-xs">
          <span
            style={{ backgroundColor: PIECE_STATE_COLORS[hoveredPiece.state] }}
            className="h-3.5 w-3.5 rounded-sm border border-white/30"
          />
          <span className="font-bold">
            {hoveredPiece.ring} #{hoveredPiece.index}
          </span>
          <span className="text-slate-300">
            {PIECE_STATE_LABELS[hoveredPiece.state]} ({hoveredPiece.state})
          </span>
          {hoveredPiece.hasPhoto && (
            <span className="inline-flex items-center gap-1 rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
              <Camera className="h-3 w-3" />
              <span>Foto</span>
            </span>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute right-3 bottom-3 z-10 flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-300 backdrop-blur-xs">
        <span className="text-sky-400">← Tapa Alimentación (FIHL·FMFL·OHL)</span>
        <span className="text-slate-500">|</span>
        <span>{millName} · Shell (SL R1…R7)</span>
        <span className="text-slate-500">|</span>
        <span className="text-indigo-400">Tapa Descarga (DIHL·OHL) →</span>
      </div>

      <Canvas
        camera={{ position: [9.8, 6.2, 10.8], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#090d16']} />

        {settings.realisticShading ? (
          <>
            <ambientLight intensity={0.65} />
            <hemisphereLight
              args={['#f8fafc', '#1e293b', 0.65]}
              position={[0, 12, 0]}
            />
            <directionalLight position={[10, 14, 12]} intensity={1.15} />
            <directionalLight position={[-12, 8, -10]} intensity={0.65} />
            <pointLight position={[0, 0.4, 0]} intensity={1.3} distance={14} />
          </>
        ) : (
          <ambientLight intensity={1.2} />
        )}

        <MillCameraRig
          preset={settings.cameraPreset}
          trigger={settings.cameraTrigger}
          autoRotate={settings.autoRotate}
          exploded={settings.exploded}
        />

        <group>
          <mesh
            position={[-5.25 - trunnionShift, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.92, 1.02, 1.1, 28, 1, true]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.6}
              roughness={0.4}
              wireframe={settings.wireframe}
            />
          </mesh>

          <mesh
            position={[5.25 + trunnionShift, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[1.05, 0.96, 1.1, 28, 1, true]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.6}
              roughness={0.4}
              wireframe={settings.wireframe}
            />
          </mesh>

          <MillLinerMeshes
            pieces={pieces}
            settings={settings}
            activeFilter={activeFilter}
            isMinera={isMinera}
            selectedPieceId={selectedPieceId}
            onSelectPiece={onSelectPiece}
            onHoverPiece={onHoverPiece}
            onCyclePiece={onCyclePiece}
            onTogglePhoto={onTogglePhoto}
          />

          {settings.animatedBalls && (
            <AnimatedBallsCharge
              enabled={settings.animatedBalls}
              realisticShading={settings.realisticShading}
              wireframe={settings.wireframe}
            />
          )}

          <gridHelper
            args={[26, 26, '#1e293b', '#0f172a']}
            position={[0, -3.85, 0]}
          />
        </group>
      </Canvas>
    </div>
  )
}
