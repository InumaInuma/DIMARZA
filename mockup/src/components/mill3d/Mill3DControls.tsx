import {
  Box,
  Camera,
  Eye,
  Grid,
  Layers,
  Lock,
  RotateCw,
  Sliders,
  Sparkles,
  Tag,
} from 'lucide-react'

export type CameraPreset =
  | 'isometric'
  | 'lateral'
  | 'feed'
  | 'discharge'
  | 'top'
  | 'interior'

export interface Mill3DViewSettings {
  cameraPreset: CameraPreset
  cameraTrigger: number
  realisticShading: boolean
  exploded: boolean
  shellTransparency: number
  autoRotate: boolean
  showShellLabels: boolean
  showFeedLabels: boolean
  showDischargeLabels: boolean
  animatedBalls: boolean
  wireframe: boolean
  xray: boolean
}

interface Mill3DControlsProps {
  settings: Mill3DViewSettings
  isMinera: boolean
  onSelectCamera: (preset: CameraPreset) => void
  onUpdateSettings: (patch: Partial<Mill3DViewSettings>) => void
}

const CAMERA_BUTTONS: ReadonlyArray<{ id: CameraPreset; label: string }> = [
  { id: 'isometric', label: 'Isométrica' },
  { id: 'lateral', label: 'Lateral' },
  { id: 'feed', label: 'Tapa alim.' },
  { id: 'discharge', label: 'Tapa desc.' },
  { id: 'top', label: 'Superior' },
  { id: 'interior', label: 'Interior' },
]

export default function Mill3DControls({
  settings,
  isMinera,
  onSelectCamera,
  onUpdateSettings,
}: Mill3DControlsProps) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase">
            <Camera className="h-3.5 w-3.5 text-sky-600" />
            <span>Cámara:</span>
          </span>
          {CAMERA_BUTTONS.map((preset) => {
            const isActive = settings.cameraPreset === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectCamera(preset.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {preset.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isMinera && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              <Lock className="h-3.5 w-3.5" />
              <span>Vista de solo lectura</span>
            </span>
          )}

          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => onUpdateSettings({ realisticShading: true })}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                settings.realisticShading
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vista realista
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ realisticShading: false })}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                !settings.realisticShading
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vista plana
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="flex flex-wrap items-center gap-2 lg:col-span-5">
          <button
            type="button"
            onClick={() => onUpdateSettings({ exploded: !settings.exploded })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              settings.exploded
                ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Modo explotado</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ autoRotate: !settings.autoRotate })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              settings.autoRotate
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Auto-rotar</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ animatedBalls: !settings.animatedBalls })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              settings.animatedBalls
                ? 'border-sky-300 bg-sky-50 text-sky-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Bolas animadas: {settings.animatedBalls ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ wireframe: !settings.wireframe })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              settings.wireframe
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Wireframe</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ xray: !settings.xray })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              settings.xray
                ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>X-Ray</span>
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 lg:col-span-3">
          <Sliders className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <label
            htmlFor="shell-transparency-slider"
            className="text-xs font-semibold whitespace-nowrap text-slate-700"
          >
            Transp. Shell:
          </label>
          <input
            id="shell-transparency-slider"
            type="range"
            min={0}
            max={100}
            step={5}
            value={settings.shellTransparency}
            onChange={(event) =>
              onUpdateSettings({ shellTransparency: Number(event.target.value) })
            }
            className="h-1.5 w-full cursor-pointer accent-sky-600"
          />
          <span className="w-9 text-right text-xs font-bold text-slate-900">
            {settings.shellTransparency}%
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 lg:col-span-4">
          <span className="mr-1 inline-flex items-center gap-1 text-xs font-bold text-slate-500">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            <span>Etiquetas:</span>
          </span>

          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ showShellLabels: !settings.showShellLabels })
            }
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
              settings.showShellLabels
                ? 'border-sky-300 bg-sky-50 text-sky-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Box className="h-3 w-3" />
            <span>N° Shell</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ showFeedLabels: !settings.showFeedLabels })
            }
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
              settings.showFeedLabels
                ? 'border-sky-300 bg-sky-50 text-sky-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>N° T.Alim</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ showDischargeLabels: !settings.showDischargeLabels })
            }
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
              settings.showDischargeLabels
                ? 'border-sky-300 bg-sky-50 text-sky-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>N° T.Desc</span>
          </button>
        </div>
      </div>
    </div>
  )
}
