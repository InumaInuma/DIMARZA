import { Activity, Eye } from 'lucide-react'
import GanttChart from '../components/plan/GanttChart.tsx'
import IncidentPanel from '../components/plan/IncidentPanel.tsx'
import MilestoneManager from '../components/plan/MilestoneManager.tsx'
import PiecesSCurveChart from '../components/plan/PiecesSCurveChart.tsx'
import ShutdownSCurveChart from '../components/plan/ShutdownSCurveChart.tsx'
import { selectMillKpiMetrics } from '../store/selectors.ts'
import { useMillStore } from '../store/useMillStore.ts'

export default function PlanPage() {
  const metrics = useMillStore(selectMillKpiMetrics)
  const currentUser = useMillStore((s) => s.currentUser)
  const isMinera = currentUser?.role === 'minera'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Curvas S, Carta Gantt e Incidencias · {metrics.millName}
            </h1>
            <p className="text-xs text-slate-500">
              {metrics.site} · {metrics.shutdown} · Control de programación 72 h, SPI y actividades por turno
            </p>
          </div>
        </div>

        {isMinera && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
            <Eye className="h-4 w-4 text-amber-600" />
            <span>Vista de solo lectura · Rol Minera</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <PiecesSCurveChart />
        <ShutdownSCurveChart />
      </div>

      <GanttChart />

      <MilestoneManager />

      <IncidentPanel />
    </div>
  )
}
