import { Box } from 'lucide-react'
import { useState } from 'react'
import Mill3DCanvas from '../components/mill3d/Mill3DCanvas.tsx'
import Mill3DControls, {
  type CameraPreset,
  type Mill3DViewSettings,
} from '../components/mill3d/Mill3DControls.tsx'
import Mill3DLegend from '../components/mill3d/Mill3DLegend.tsx'
import type { PieceFilter } from '../store/selectors.ts'
import { selectMillKpiMetrics } from '../store/selectors.ts'
import { useMillStore } from '../store/useMillStore.ts'

const FILTER_OPTIONS: ReadonlyArray<{ id: PieceFilter; label: string }> = [
  { id: 'ALL', label: 'Todos (280)' },
  { id: 'P', label: 'Solo P' },
  { id: 'R', label: 'Solo R' },
  { id: 'RC', label: 'Solo RC' },
  { id: 'PENDING', label: 'Pendientes (P+R)' },
]

export default function Mill3DPage() {
  const mills = useMillStore((s) => s.mills)
  const activeMillCode = useMillStore((s) => s.activeMillCode)
  const currentUser = useMillStore((s) => s.currentUser)
  const cyclePiece = useMillStore((s) => s.cyclePiece)
  const togglePhoto = useMillStore((s) => s.togglePhoto)
  const metrics = useMillStore(selectMillKpiMetrics)

  const activeMill = mills[activeMillCode] ?? Object.values(mills)[0]
  const pieces = activeMill?.pieces ?? []
  const isMinera = currentUser?.role === 'minera'

  const [activeFilter, setActiveFilter] = useState<PieceFilter>('ALL')
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null)
  const [hoveredPieceId, setHoveredPieceId] = useState<string | null>(null)

  const [settings, setSettings] = useState<Mill3DViewSettings>({
    cameraPreset: 'isometric',
    cameraTrigger: 0,
    realisticShading: true,
    exploded: false,
    shellTransparency: 0,
    autoRotate: false,
    showShellLabels: false,
    showFeedLabels: false,
    showDischargeLabels: false,
    animatedBalls: false,
    wireframe: false,
    xray: false,
  })

  const handleSelectCamera = (preset: CameraPreset) => {
    setSettings((prev) => ({
      ...prev,
      cameraPreset: preset,
      cameraTrigger: prev.cameraTrigger + 1,
    }))
  }

  const handleUpdateSettings = (patch: Partial<Mill3DViewSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...patch,
    }))
  }

  const hoveredPiece = hoveredPieceId
    ? (pieces.find((p) => p.id === hoveredPieceId) ?? null)
    : null
  const selectedPiece = selectedPieceId
    ? (pieces.find((p) => p.id === selectedPieceId) ?? null)
    : null
  const inspectedPiece = hoveredPiece ?? selectedPiece

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Box className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Vista 3D · {metrics.millName}
            </h1>
            <p className="text-xs text-slate-500">
              Cilindro horizontal (196 placas en 7 anillos) y tapas cónicas de alimentación (48) y descarga (36)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setActiveFilter(opt.id)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                activeFilter === opt.id
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Mill3DControls
        settings={settings}
        isMinera={isMinera}
        onSelectCamera={handleSelectCamera}
        onUpdateSettings={handleUpdateSettings}
      />

      <Mill3DCanvas
        millCode={metrics.millCode}
        millName={metrics.millName}
        pieces={pieces}
        settings={settings}
        activeFilter={activeFilter}
        isMinera={isMinera}
        selectedPieceId={selectedPieceId}
        hoveredPiece={hoveredPiece}
        onSelectPiece={setSelectedPieceId}
        onHoverPiece={setHoveredPieceId}
        onCyclePiece={cyclePiece}
        onTogglePhoto={togglePhoto}
      />

      <Mill3DLegend
        metrics={metrics}
        inspectedPiece={inspectedPiece}
        isMinera={isMinera}
        onCyclePiece={cyclePiece}
        onTogglePhoto={togglePhoto}
      />
    </div>
  )
}
