import { Camera, CheckCircle2, Clock, Lock, MousePointerClick, Wrench } from 'lucide-react'
import type { Piece, PieceState } from '../../domain/types.ts'
import { PIECE_STATE_COLORS, PIECE_STATE_LABELS } from '../../domain/types.ts'
import type { MillKpiMetrics } from '../../store/selectors.ts'

interface Mill3DLegendProps {
  metrics: MillKpiMetrics
  inspectedPiece: Piece | null
  isMinera: boolean
  onCyclePiece: (pieceId: string) => void
  onTogglePhoto: (pieceId: string) => void
}

const LEGEND_STATES: ReadonlyArray<{
  state: PieceState
  shortLabel: string
  description: string
}> = [
  {
    state: 'P',
    shortLabel: 'P · Pendiente',
    description: 'Revestimiento original en espera de intervención',
  },
  {
    state: 'R',
    shortLabel: 'R · Retirado',
    description: 'Placa desmontada, alojamiento limpio en espera de montaje',
  },
  {
    state: 'RC',
    shortLabel: 'RC · Retirado y cambiado',
    description: 'Placa nueva instalada y torqueada',
  },
]

function getSectionName(section: Piece['section']): string {
  if (section === 'shell') {
    return 'Shell (Cilindro)'
  }
  if (section === 'feed') {
    return 'Tapa de alimentación'
  }
  return 'Tapa de descarga'
}

export default function Mill3DLegend({
  metrics,
  inspectedPiece,
  isMinera,
  onCyclePiece,
  onTogglePhoto,
}: Mill3DLegendProps) {
  const countByState: Record<PieceState, number> = {
    P: metrics.pendingCount,
    R: metrics.removedCount,
    RC: metrics.changedCount,
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:col-span-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Leyenda de estados y conteo en vivo ({metrics.totalPieces} placas)
            </h2>
            <p className="text-xs text-slate-500">
              Colores sincronizados en tiempo real con Mapeo 2D y tarjetas KPI
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
            Avance total: {metrics.changedPercent}% ({metrics.changedCount} / {metrics.totalPieces})
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {LEGEND_STATES.map((item) => {
            const count = countByState[item.state]
            const pct =
              metrics.totalPieces > 0
                ? Math.round((count / metrics.totalPieces) * 1000) / 10
                : 0
            return (
              <div
                key={item.state}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: PIECE_STATE_COLORS[item.state] }}
                      className="h-4 w-4 shrink-0 rounded border border-black/10 shadow-2xs"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      {item.shortLabel}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">
                    {count}
                  </span>
                </div>

                <p className="mt-1.5 text-[11px] text-slate-500">{item.description}</p>

                <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/80 pt-2 text-[11px] font-semibold text-slate-600">
                  <span>Proporción del molino</span>
                  <span>{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-3">
          {[metrics.shell, metrics.feed, metrics.discharge].map((sec) => (
            <div
              key={sec.section}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
            >
              <div>
                <p className="font-bold text-slate-800">{sec.label}</p>
                <p className="text-[11px] text-slate-500">
                  P: {sec.pending} · R: {sec.removed} · RC: {sec.changed}
                </p>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 font-extrabold text-slate-800">
                {sec.changed}/{sec.total} ({sec.changedPercent}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:col-span-4">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Inspección de placa 3D
            </h2>
            {isMinera ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                <Lock className="h-3 w-3" />
                <span>Solo lectura</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                <MousePointerClick className="h-3 w-3" />
                <span>Interactivo</span>
              </span>
            )}
          </div>

          {inspectedPiece ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {getSectionName(inspectedPiece.section)}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Anillo {inspectedPiece.ring} · Placa #{inspectedPiece.index}
                  </h3>
                </div>
                <span
                  style={{ backgroundColor: PIECE_STATE_COLORS[inspectedPiece.state] }}
                  className={`rounded-md px-2.5 py-1 text-xs font-extrabold shadow-2xs ${
                    inspectedPiece.state === 'R' ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {PIECE_STATE_LABELS[inspectedPiece.state]} ({inspectedPiece.state})
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5 text-sky-600" />
                  <span>
                    {inspectedPiece.hasPhoto ? 'Con registro fotográfico' : 'Sin foto adjunta'}
                  </span>
                </span>
                {inspectedPiece.updatedBy && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {inspectedPiece.updatedBy} ({inspectedPiece.updatedAt ?? ''})
                    </span>
                  </span>
                )}
              </div>

              {!isMinera && (
                <div className="mt-3 flex items-center gap-2 border-t border-slate-200 pt-2.5">
                  <button
                    type="button"
                    onClick={() => onCyclePiece(inspectedPiece.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Cambiar estado (P→R→RC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onTogglePhoto(inspectedPiece.id)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <Camera className="h-3.5 w-3.5 text-sky-600" />
                    <span>{inspectedPiece.hasPhoto ? 'Quitar foto' : 'Foto'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
              <p className="text-xs font-semibold text-slate-600">
                Pasa el cursor o haz clic sobre cualquier placa del modelo 3D
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {isMinera
                  ? 'Modo cliente minera: visualización 3D en vivo sin edición.'
                  : 'Clic izquierdo rota el estado (P → R → RC) · Clic derecho alterna foto.'}
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>280 geometrías compartidas de alto rendimiento</span>
          </span>
          <span>Photos: {metrics.photoCount}</span>
        </div>
      </div>
    </div>
  )
}
