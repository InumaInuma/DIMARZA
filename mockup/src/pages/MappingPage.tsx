import { Grid } from 'lucide-react'
import { useState } from 'react'
import ActionToolbar from '../components/kpi/ActionToolbar.tsx'
import KpiCardsGrid from '../components/kpi/KpiCardsGrid.tsx'
import PlanStatusBanner from '../components/kpi/PlanStatusBanner.tsx'
import EndCapPolarView from '../components/mapping/EndCapPolarView.tsx'
import PieceFilterBar from '../components/mapping/PieceFilterBar.tsx'
import ShellGrid from '../components/mapping/ShellGrid.tsx'
import type { PieceFilter } from '../store/selectors.ts'
import { selectMillKpiMetrics } from '../store/selectors.ts'
import { useMillStore } from '../store/useMillStore.ts'

type SectionViewMode = 'all' | 'shell' | 'caps'

export default function MappingPage() {
  const metrics = useMillStore(selectMillKpiMetrics)
  const [activeFilter, setActiveFilter] = useState<PieceFilter>('ALL')
  const [sectionView, setSectionView] = useState<SectionViewMode>('all')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Grid className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Mapeo 2D · {metrics.millName}
            </h1>
            <p className="text-xs text-slate-500">
              Shell desplegado (7×28) y vista frontal polar de Tapas de Alimentación y Descarga
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {(
            [
              { id: 'all', label: 'Vista completa (280)' },
              { id: 'shell', label: 'Solo Shell (196)' },
              { id: 'caps', label: 'Solo Tapas (84)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSectionView(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                sectionView === tab.id
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ActionToolbar />

      <PlanStatusBanner />

      <KpiCardsGrid />

      <PieceFilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {(sectionView === 'all' || sectionView === 'shell') && (
        <ShellGrid activeFilter={activeFilter} />
      )}

      {(sectionView === 'all' || sectionView === 'caps') && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <EndCapPolarView section="feed" activeFilter={activeFilter} />
          <EndCapPolarView section="discharge" activeFilter={activeFilter} />
        </div>
      )}
    </div>
  )
}
