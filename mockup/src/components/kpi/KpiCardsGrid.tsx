import { PIECE_STATE_COLORS } from '../../domain/types.ts'
import { selectMillKpiMetrics } from '../../store/selectors.ts'
import { useMillStore } from '../../store/useMillStore.ts'

export default function KpiCardsGrid() {
  const metrics = useMillStore(selectMillKpiMetrics)

  const sectionCards = [
    metrics.shell,
    metrics.feed,
    metrics.discharge,
  ]

  const planCompliancePercent =
    metrics.expectedPieces > 0
      ? Math.min(100, Math.round((metrics.changedCount / metrics.expectedPieces) * 100))
      : 100

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Avance total
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
              {metrics.millCode}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {metrics.changedPercent}%
            </span>
            <span className="text-xs font-medium text-slate-500">RC sobre {metrics.totalPieces}</span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              style={{
                width: `${(metrics.changedCount / Math.max(1, metrics.totalPieces)) * 100}%`,
                backgroundColor: PIECE_STATE_COLORS.RC,
              }}
              className="transition-all duration-300"
            />
            <div
              style={{
                width: `${(metrics.removedCount / Math.max(1, metrics.totalPieces)) * 100}%`,
                backgroundColor: PIECE_STATE_COLORS.R,
              }}
              className="transition-all duration-300"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold text-slate-700">
            <span>
              {metrics.changedCount} / {metrics.totalPieces} cambiados
            </span>
            <span className="text-amber-700">{metrics.removedCount + metrics.changedCount} retirados</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Avance vs plan
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                metrics.isOnTrack
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {metrics.planDelta >= 0 ? `+${metrics.planDelta}` : metrics.planDelta} pzas
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {metrics.changedCount}
            </span>
            <span className="text-sm font-semibold text-slate-500">
              / {metrics.expectedPieces} esp.
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              style={{
                width: `${planCompliancePercent}%`,
                backgroundColor: metrics.isOnTrack ? PIECE_STATE_COLORS.RC : '#ef4444',
              }}
              className="transition-all duration-300"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold text-slate-700">
            <span>Esperado: {metrics.expectedPieces}</span>
            <span>Real: {metrics.changedCount}</span>
          </div>
        </div>
      </div>

      {sectionCards.map((section) => {
        const changedWidth = (section.changed / Math.max(1, section.total)) * 100
        const removedWidth = (section.removed / Math.max(1, section.total)) * 100

        return (
          <div
            key={section.section}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {section.label}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {section.total} pzas
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {section.changedPercent}%
                </span>
                <span className="text-xs font-medium text-slate-500">
                  P: {section.pending}
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  style={{
                    width: `${changedWidth}%`,
                    backgroundColor: PIECE_STATE_COLORS.RC,
                  }}
                  className="transition-all duration-300"
                />
                <div
                  style={{
                    width: `${removedWidth}%`,
                    backgroundColor: PIECE_STATE_COLORS.R,
                  }}
                  className="transition-all duration-300"
                />
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>
                  R: {section.removed + section.changed} · C: {section.changed} / {section.total}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
