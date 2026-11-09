import { AlertTriangle, CheckCircle2, Eye } from 'lucide-react'
import { selectMillKpiMetrics } from '../../store/selectors.ts'
import { useMillStore } from '../../store/useMillStore.ts'

export default function PlanStatusBanner() {
  const metrics = useMillStore(selectMillKpiMetrics)
  const currentUser = useMillStore((s) => s.currentUser)
  const isMinera = currentUser?.role === 'minera'

  const behindCount = Math.max(0, metrics.expectedPieces - metrics.changedCount)
  const aheadCount = Math.max(0, metrics.changedCount - metrics.expectedPieces)

  return (
    <div className="space-y-3">
      {isMinera && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Eye className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <span className="text-sm font-bold">Vista de solo lectura</span>
              <span className="ml-2 text-xs text-amber-800">
                El rol Minera permite supervisar KPIs y mapeo en vivo, sin modificar estados de piezas ni hitos.
              </span>
            </div>
          </div>
          <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
            Solo lectura
          </span>
        </div>
      )}

      <div
        className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-3.5 shadow-xs transition-colors ${
          metrics.isOnTrack
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
            : 'border-red-300 bg-red-50 text-red-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {metrics.isOnTrack ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          )}
          <div>
            <span className="text-sm font-bold">
              {metrics.isOnTrack
                ? 'Avance en línea con el plan'
                : `Atrasado ${behindCount} piezas`}
            </span>
            <span
              className={`ml-3 text-xs font-medium ${
                metrics.isOnTrack ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              Real: {metrics.changedCount} RC vs Esperado: {metrics.expectedPieces} RC ({metrics.currentShiftLabel})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              metrics.isOnTrack
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {metrics.isOnTrack
              ? aheadCount > 0
                ? `+${aheadCount} piezas sobre meta`
                : 'Meta cumplida (0 desvío)'
              : `-${behindCount} piezas bajo meta`}
          </span>
        </div>
      </div>
    </div>
  )
}
