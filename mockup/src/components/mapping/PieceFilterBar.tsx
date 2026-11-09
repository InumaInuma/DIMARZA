import { Camera, Filter } from 'lucide-react'
import { PIECE_STATE_COLORS, PIECE_STATE_LABELS } from '../../domain/types.ts'
import type { PieceFilter } from '../../store/selectors.ts'
import { selectMillKpiMetrics } from '../../store/selectors.ts'
import { useMillStore } from '../../store/useMillStore.ts'

interface PieceFilterBarProps {
  activeFilter: PieceFilter
  onFilterChange: (filter: PieceFilter) => void
}

const FILTER_OPTIONS: ReadonlyArray<{ id: PieceFilter; label: string }> = [
  { id: 'ALL', label: 'Todos' },
  { id: 'P', label: 'Solo P' },
  { id: 'R', label: 'Solo R' },
  { id: 'RC', label: 'Solo RC' },
  { id: 'PENDING', label: 'Pendientes (P+R)' },
]

export default function PieceFilterBar({
  activeFilter,
  onFilterChange,
}: PieceFilterBarProps) {
  const metrics = useMillStore(selectMillKpiMetrics)
  const currentUser = useMillStore((s) => s.currentUser)
  const isMinera = currentUser?.role === 'minera'

  const countForFilter = (filter: PieceFilter): number => {
    switch (filter) {
      case 'ALL':
        return metrics.totalPieces
      case 'P':
        return metrics.pendingCount
      case 'R':
        return metrics.removedCount
      case 'RC':
        return metrics.changedCount
      case 'PENDING':
        return metrics.pendingCount + metrics.removedCount
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <div className=" mr-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          <span>Filtro:</span>
        </div>
        {FILTER_OPTIONS.map((option) => {
          const isActive = activeFilter === option.id
          const count = countForFilter(option.id)
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onFilterChange(option.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{option.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[11px] ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-3">
          {(['P', 'R', 'RC'] as const).map((stateKey) => (
            <div key={stateKey} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3.5 w-3.5 rounded-sm border border-black/10"
                style={{ backgroundColor: PIECE_STATE_COLORS[stateKey] }}
              />
              <span className="font-semibold text-slate-700">
                {stateKey}: {PIECE_STATE_LABELS[stateKey]}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 text-slate-500">
          <Camera className="h-3.5 w-3.5 text-slate-600" />
          <span>
            {isMinera
              ? `Fotos: ${metrics.photoCount} · Vista de solo lectura`
              : `Fotos: ${metrics.photoCount} · Clic: cambiar estado · Clic derecho: foto`}
          </span>
        </div>
      </div>
    </div>
  )
}
