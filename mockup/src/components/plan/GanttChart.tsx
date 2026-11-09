import ReactECharts from 'echarts-for-react'
import { CalendarClock } from 'lucide-react'
import { selectGanttChartData } from '../../store/selectors.ts'
import { useMillStore } from '../../store/useMillStore.ts'

interface CustomRenderParams {
  coordSys: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface CustomRenderApi {
  value: (dim: number) => number
  coord: (val: [number, number]) => number[]
}

function truncateLabel(name: string, isSummary: boolean): string {
  const maxLen = isSummary ? 36 : 42
  if (name.length <= maxLen) {
    return isSummary ? `▸ ${name}` : `   ${name}`
  }
  const clipped = `${name.slice(0, maxLen - 1)}…`
  return isSummary ? `▸ ${clipped}` : `   ${clipped}`
}

export default function GanttChart() {
  const gantt = useMillStore(selectGanttChartData)

  const yLabels = gantt.items.map((item) => truncateLabel(item.name, item.isSummary))

  const seriesData = gantt.items.map((item, idx) => ({
    name: item.name,
    value: [
      idx,
      item.startHour,
      item.endHour,
      item.progress,
      item.isSummary ? 1 : 0,
      item.durationHours,
    ],
  }))

  const renderItem = (_params: CustomRenderParams, api: CustomRenderApi) => {
    const rowIndex = api.value(0)
    const startHour = api.value(1)
    const endHour = api.value(2)
    const progress = api.value(3)
    const isSummary = api.value(4) === 1

    const startCoord = api.coord([startHour, rowIndex])
    const endCoord = api.coord([endHour, rowIndex])

    const xStart = startCoord[0] ?? 0
    const xEnd = endCoord[0] ?? xStart + 6
    const yCenter = startCoord[1] ?? 0

    const totalWidth = Math.max(6, xEnd - xStart)
    const filledWidth = Math.max(0, Math.min(totalWidth, totalWidth * (progress / 100)))
    const barHeight = isSummary ? 18 : 14
    const yTop = yCenter - barHeight / 2

    const bgFill = isSummary ? '#cbd5e1' : '#e2e8f0'
    const strokeColor = isSummary ? '#475569' : '#94a3b8'
    const progressFill =
      progress >= 100 ? '#22c55e' : isSummary ? '#0284c7' : '#0ea5e9'

    return {
      type: 'group',
      children: [
        {
          type: 'rect',
          shape: {
            x: xStart,
            y: yTop,
            width: totalWidth,
            height: barHeight,
            r: 4,
          },
          style: {
            fill: bgFill,
            stroke: strokeColor,
            lineWidth: 1,
          },
        },
        {
          type: 'rect',
          shape: {
            x: xStart,
            y: yTop,
            width: filledWidth,
            height: barHeight,
            r: 4,
          },
          style: {
            fill: progressFill,
          },
        },
        {
          type: 'text',
          style: {
            text: `${progress}%`,
            x: xStart + totalWidth + 6,
            y: yCenter,
            textVerticalAlign: 'middle',
            textAlign: 'left',
            fill: isSummary ? '#0f172a' : '#334155',
            fontSize: 11,
            fontWeight: isSummary ? 700 : 600,
          },
        },
      ],
    }
  }

  const chartHeight = Math.max(380, gantt.items.length * 30 + 80)

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0f172a',
      borderColor: '#1e293b',
      textStyle: { color: '#f8fafc', fontSize: 12 },
      formatter: (params: { name?: string; value?: number[] }) => {
        const val = params.value ?? []
        const startH = val[1] ?? 0
        const endH = val[2] ?? 0
        const prog = val[3] ?? 0
        const dur = val[5] ?? 0
        return [
          `<div style="font-weight:700;margin-bottom:4px">${params.name ?? ''}</div>`,
          `<div>Inicio: <b>Hora ${startH}h</b> · Fin: <b>Hora ${endH}h</b></div>`,
          `<div>Duración: <b>${dur} h</b> · Avance: <b>${prog}%</b></div>`,
        ].join('')
      },
    },
    grid: {
      top: 36,
      right: 56,
      bottom: 36,
      left: 260,
      containLabel: false,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: gantt.totalHours,
      interval: 6,
      name: 'Horas',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLabel: {
        color: '#475569',
        fontSize: 11,
        formatter: '{value}h',
      },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: yLabels,
      axisLabel: {
        color: '#1e293b',
        fontSize: 11,
        width: 245,
        overflow: 'truncate',
      },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      splitLine: { show: true, lineStyle: { color: '#f8fafc' } },
    },
    series: [
      {
        name: 'Actividades Shutdown',
        type: 'custom',
        renderItem,
        encode: {
          x: [1, 2],
          y: 0,
        },
        data: seriesData,
        markLine: {
          symbol: ['none', 'none'],
          silent: true,
          lineStyle: {
            color: '#ef4444',
            width: 2,
            type: 'solid',
          },
          label: {
            show: true,
            position: 'end',
            formatter: `Hora actual (${gantt.currentHour}h)`,
            color: '#dc2626',
            fontWeight: 'bold',
            fontSize: 11,
            backgroundColor: '#fef2f2',
            borderColor: '#fecaca',
            borderWidth: 1,
            borderRadius: 4,
            padding: [2, 6],
          },
          data: [{ xAxis: gantt.currentHour }],
        },
      },
    ],
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Carta Gantt por Horas (0–{gantt.totalHours}h)</h2>
            <p className="text-xs text-slate-500">
              Barras horizontales personalizadas con % de avance relleno y corte en hora actual ({gantt.currentHour}h · {gantt.currentShiftLabel})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#22c55e]" />
            Completado (100%)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#0ea5e9]" />
            En progreso
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#e2e8f0] ring-1 ring-slate-400" />
            Duración programada
          </span>
          <span className="inline-flex items-center gap-1.5 text-red-600">
            <span className="h-3 w-0.5 bg-red-500" />
            Hora actual ({gantt.currentHour}h)
          </span>
        </div>
      </div>

      <ReactECharts option={option} style={{ height: chartHeight, width: '100%' }} notMerge />
    </div>
  )
}
