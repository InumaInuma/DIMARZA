import { ArrowRight, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ActionToolbar from '../components/kpi/ActionToolbar.tsx'
import KpiCardsGrid from '../components/kpi/KpiCardsGrid.tsx'
import PlanStatusBanner from '../components/kpi/PlanStatusBanner.tsx'
import EndCapPolarView from '../components/mapping/EndCapPolarView.tsx'
import PieceFilterBar from '../components/mapping/PieceFilterBar.tsx'
import ShellGrid from '../components/mapping/ShellGrid.tsx'
import type { PieceFilter } from '../store/selectors.ts'
import { selectMillKpiMetrics } from '../store/selectors.ts'
import { useMillStore } from '../store/useMillStore.ts'

export default function DashboardPage() {
  const metrics = useMillStore(selectMillKpiMetrics)
  const [activeFilter, setActiveFilter] = useState<PieceFilter>('ALL')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Inicio (KPIs) · {metrics.millName}
            </h1>
            <p className="text-xs text-slate-500">
              {metrics.site} · {metrics.shutdown} · Control en tiempo real de {metrics.totalPieces} revestimientos
            </p>
          </div>
        </div>

        <Link
          to="/mapeo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-500"
        >
          <span>Ir a Mapeo 2D completo</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ActionToolbar />

      <PlanStatusBanner />

      <KpiCardsGrid />

      <PieceFilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <ShellGrid activeFilter={activeFilter} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <EndCapPolarView section="feed" activeFilter={activeFilter} />
        <EndCapPolarView section="discharge" activeFilter={activeFilter} />
      </div>
    </div>
  )
}
