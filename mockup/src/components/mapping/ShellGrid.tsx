import { Camera, Lock } from 'lucide-react'
import { SHELL_RINGS } from '../../domain/seed.ts'
import type { Piece } from '../../domain/types.ts'
import { PIECE_STATE_COLORS, PIECE_STATE_LABELS } from '../../domain/types.ts'
import type { PieceFilter } from '../../store/selectors.ts'
import { matchesPieceFilter, selectMillKpiMetrics } from '../../store/selectors.ts'
import { useMillStore } from '../../store/useMillStore.ts'

interface ShellGridProps {
  activeFilter: PieceFilter
}

const ROW_INDICES = Array.from({ length: 28 }, (_, i) => i + 1)

export default function ShellGrid({ activeFilter }: ShellGridProps) {
  const mills = useMillStore((s) => s.mills)
  const activeMillCode = useMillStore((s) => s.activeMillCode)
  const currentUser = useMillStore((s) => s.currentUser)
  const cyclePiece = useMillStore((s) => s.cyclePiece)
  const togglePhoto = useMillStore((s) => s.togglePhoto)
  const metrics = useMillStore(selectMillKpiMetrics)

  const activeMill = mills[activeMillCode] ?? Object.values(mills)[0]
  const isMinera = currentUser?.role === 'minera'

  const pieceLookup = new Map<string, Piece>()
  for (const piece of activeMill?.pieces ?? []) {
    if (piece.section === 'shell') {
      pieceLookup.set(`${piece.ring}-${piece.index}`, piece)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Shell desplegado (7 anillos × 28 filas = {metrics.shell.total} piezas)
          </h2>
          <p className="text-xs text-slate-500">
            Avance Shell: {metrics.shell.changed} cambiados ({metrics.shell.changedPercent}%) ·{' '}
            {metrics.shell.removed + metrics.shell.changed} retirados · {metrics.shell.pending} pendientes
          </p>
        </div>

        {isMinera && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            <Lock className="h-3.5 w-3.5" />
            <span>Vista de solo lectura</span>
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="mb-2 grid grid-cols-7 gap-2">
            {metrics.shellRings.map((ringSummary) => (
              <div
                key={ringSummary.ring}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{ringSummary.ring}</span>
                  <span className="text-xs font-extrabold text-emerald-700">
                    {ringSummary.changedPercent}%
                  </span>
                </div>

                <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    style={{
                      width: `${(ringSummary.changed / Math.max(1, ringSummary.total)) * 100}%`,
                      backgroundColor: PIECE_STATE_COLORS.RC,
                    }}
                    className="transition-all duration-300"
                  />
                  <div
                    style={{
                      width: `${(ringSummary.removed / Math.max(1, ringSummary.total)) * 100}%`,
                      backgroundColor: PIECE_STATE_COLORS.R,
                    }}
                    className="transition-all duration-300"
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>R: {ringSummary.removed + ringSummary.changed}</span>
                  <span>
                    C: {ringSummary.changed}/{ringSummary.total}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {ROW_INDICES.map((rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-7 gap-2">
                {SHELL_RINGS.map((ring) => {
                  const piece = pieceLookup.get(`${ring}-${rowIndex}`)
                  if (!piece) {
                    return <div key={`${ring}-${rowIndex}`} className="h-7 rounded bg-slate-100" />
                  }

                  const visibleByFilter = matchesPieceFilter(piece.state, activeFilter)
                  const bgColor = PIECE_STATE_COLORS[piece.state]
                  const textColorClass =
                    piece.state === 'R' ? 'text-slate-900' : 'text-white'

                  const tooltipText = [
                    `${piece.ring} #${piece.index}`,
                    `Estado: ${PIECE_STATE_LABELS[piece.state]} (${piece.state})`,
                    piece.hasPhoto ? 'Con foto adjunta' : 'Sin foto',
                    piece.updatedBy ? `Por: ${piece.updatedBy} (${piece.updatedAt ?? ''})` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')

                  return (
                    <button
                      key={piece.id}
                      type="button"
                      title={tooltipText}
                      disabled={isMinera || !visibleByFilter}
                      onClick={() => {
                        if (!isMinera && visibleByFilter) {
                          cyclePiece(piece.id)
                        }
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault()
                        if (!isMinera && visibleByFilter) {
                          togglePhoto(piece.id)
                        }
                      }}
                      style={{ backgroundColor: bgColor }}
                      className={`group relative flex h-7 items-center justify-between rounded px-2 text-xs font-bold shadow-2xs transition-all ${textColorClass} ${
                        !visibleByFilter
                          ? 'cursor-default opacity-20 saturate-50'
                          : isMinera
                            ? 'cursor-default'
                            : 'cursor-pointer hover:brightness-95 active:scale-[0.98]'
                      }`}
                    >
                      <span>#{piece.index}</span>
                      <span className="flex items-center gap-1">
                        {piece.hasPhoto && (
                          <Camera className="h-3 w-3 shrink-0 drop-shadow-2xs" />
                        )}
                        <span className="text-[10px] font-extrabold opacity-85">
                          {piece.state}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
