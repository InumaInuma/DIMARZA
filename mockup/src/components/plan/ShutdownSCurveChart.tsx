import ReactECharts from 'echarts-for-react'
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { selectShutdownSCurveData } from '../../store/selectors.ts'
import { useMillStore } from '../../store/useMillStore.ts'

export default function ShutdownSCurveChart() {
  const shutdownCurve = useMillStore(selectShutdownSCurveData)

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#1e293b',
      textStyle: { color: '#f8fafc', fontSize: 12 },
      valueFormatter: (value: number | string | null | undefined) =>
        value === null || value === undefined ? 'Sin reporte' : `${value}%`,
    },
    legend: {
      bottom: 0,
      data: ['Avance real (%)', 'Plan acumulado (%)'],
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
      data: shutdownCurve.categories,
      axisLabel: { color: '#475569', fontSize: 11 },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      interval: 20,
      axisLabel: {
        color: '#475569',
        fontSize: 11,
        formatter: '{value}%',
      },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [
      {
        name: 'Avance real (%)',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: shutdownCurve.realPercentSeries,
        itemStyle: { color: '#22c55e' },
        lineStyle: { color: '#22c55e', width: 3 },
        areaStyle: { color: 'rgba(34, 197, 94, 0.12)' },
      },
      {
        name: 'Plan acumulado (%)',
        type: 'line',
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 6,
        data: shutdownCurve.plannedPercentSeries,
        itemStyle: { color: '#64748b' },
        lineStyle: { color: '#64748b', width: 2, type: 'dashed' },
      },
    ],
  }

  const deviationPrefix = shutdownCurve.deviationPercent > 0 ? '+' : ''

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Curva S del Shutdown</h2>
            <p className="text-xs text-slate-500">
              % avance real ponderado por actividades ({shutdownCurve.totalEarnedHours}h /{' '}
              {shutdownCurve.totalPlannedHours}h) vs planeado acumulado
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            shutdownCurve.isBehind
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {shutdownCurve.isBehind ? (
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          )}
          <span>{shutdownCurve.isBehind ? 'Atrasado' : 'En línea'}</span>
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase text-slate-500">Desviación (%)</div>
          <div
            className={`mt-0.5 text-sm font-bold ${
              shutdownCurve.deviationPercent < 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {deviationPrefix}
            {shutdownCurve.deviationPercent.toFixed(1)}%
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase text-slate-500">Real acum.</div>
          <div className="mt-0.5 text-sm font-bold text-slate-900">
            {shutdownCurve.realAccumulatedPercent.toFixed(1)}%
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase text-slate-500">Planeado acum.</div>
          <div className="mt-0.5 text-sm font-bold text-slate-900">
            {shutdownCurve.plannedAccumulatedPercent.toFixed(1)}%
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase text-slate-500">SPI</div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className={`text-sm font-bold ${
                shutdownCurve.isBehind ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {shutdownCurve.spi.toFixed(2)}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                shutdownCurve.isBehind
                  ? 'bg-red-100 text-red-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {shutdownCurve.isBehind ? 'Atrasado' : 'En línea'}
            </span>
          </div>
        </div>

        <div className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:col-span-1">
          <div className="text-[11px] font-semibold uppercase text-slate-500">
            Turnos reportados
          </div>
          <div className="mt-0.5 text-sm font-bold text-slate-900">
            {shutdownCurve.reportedShiftsCount} / {shutdownCurve.totalShiftsCount}
          </div>
        </div>
      </div>

      <ReactECharts option={option} style={{ height: 240, width: '100%' }} notMerge />
    </div>
  )
}
