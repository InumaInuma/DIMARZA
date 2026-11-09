import ReactECharts from 'echarts-for-react'
import { TrendingUp } from 'lucide-react'
import { selectPiecesSCurveData } from '../../store/selectors.ts'
import { useMillStore } from '../../store/useMillStore.ts'

export default function PiecesSCurveChart() {
  const curve = useMillStore(selectPiecesSCurveData)

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#1e293b',
      textStyle: { color: '#f8fafc', fontSize: 12 },
    },
    legend: {
      bottom: 0,
      data: ['Cambiado', 'Retirado', 'Plan'],
      textStyle: { color: '#475569', fontSize: 12 },
    },
    grid: {
      top: 24,
      right: 20,
      bottom: 42,
      left: 44,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: curve.categories,
      axisLabel: { color: '#475569', fontSize: 11 },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 280,
      interval: 40,
      name: 'Piezas',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLabel: { color: '#475569', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [
      {
        name: 'Cambiado',
        type: 'line',
        smooth: true,
        connectNulls: true,
        symbol: 'circle',
        symbolSize: 8,
        data: curve.changedSeries,
        itemStyle: { color: '#22c55e' },
        lineStyle: { color: '#22c55e', width: 3 },
        areaStyle: { color: 'rgba(34, 197, 94, 0.12)' },
      },
      {
        name: 'Retirado',
        type: 'line',
        smooth: true,
        connectNulls: true,
        symbol: 'diamond',
        symbolSize: 8,
        data: curve.removedSeries,
        itemStyle: { color: '#f97316' },
        lineStyle: { color: '#f97316', width: 2.5 },
      },
      {
        name: 'Plan',
        type: 'line',
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 6,
        data: curve.plannedSeries,
        itemStyle: { color: '#64748b' },
        lineStyle: { color: '#64748b', width: 2, type: 'dashed' },
      },
    ],
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Curva S de Piezas</h2>
            <p className="text-xs text-slate-500">
              Avance acumulado por turno (0–{curve.totalPieces} revestimientos)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
            Cambiado: {curve.currentChanged} / {curve.totalPieces}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-700">
            <span className="h-2 w-2 rounded-full bg-[#f97316]" />
            Retirado acum.: {curve.currentRemovedTotal}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            Plan corte: {curve.expectedPieces}
          </span>
        </div>
      </div>

      <ReactECharts option={option} style={{ height: 300, width: '100%' }} notMerge />
    </div>
  )
}
