import { DISCHARGE_RINGS, FEED_RINGS, SHELL_RINGS } from '../domain/seed.ts'
import type { Milestone, Mill, Piece, PieceState, Section, ShiftPlanPoint } from '../domain/types.ts'
import type { MillStoreState } from './useMillStore.ts'

export type PieceFilter = 'ALL' | 'P' | 'R' | 'RC' | 'PENDING'

export interface SectionKpiSummary {
  section: Section
  label: string
  total: number
  pending: number
  removed: number
  changed: number
  photos: number
  changedPercent: number
}

export interface RingProgressSummary {
  ring: string
  section: Section
  total: number
  pending: number
  removed: number
  changed: number
  changedPercent: number
  removedPercent: number
}

export interface MillKpiMetrics {
  millCode: string
  millName: string
  site: string
  shutdown: string
  totalPieces: number
  pendingCount: number
  removedCount: number
  changedCount: number
  photoCount: number
  changedPercent: number
  expectedPieces: number
  currentShiftLabel: string
  planDelta: number
  isOnTrack: boolean
  shell: SectionKpiSummary
  feed: SectionKpiSummary
  discharge: SectionKpiSummary
  shellRings: RingProgressSummary[]
  feedRings: RingProgressSummary[]
  dischargeRings: RingProgressSummary[]
}

export function matchesPieceFilter(state: PieceState, filter: PieceFilter): boolean {
  switch (filter) {
    case 'ALL':
      return true
    case 'P':
      return state === 'P'
    case 'R':
      return state === 'R'
    case 'RC':
      return state === 'RC'
    case 'PENDING':
      return state === 'P' || state === 'R'
  }
}

function summarizeSection(pieces: Piece[], section: Section, label: string): SectionKpiSummary {
  const sectionPieces = pieces.filter((p) => p.section === section)
  const total = sectionPieces.length
  let pending = 0
  let removed = 0
  let changed = 0
  let photos = 0

  for (const piece of sectionPieces) {
    if (piece.state === 'P') {
      pending += 1
    } else if (piece.state === 'R') {
      removed += 1
    } else {
      changed += 1
    }
    if (piece.hasPhoto) {
      photos += 1
    }
  }

  const changedPercent = total > 0 ? Math.round((changed / total) * 1000) / 10 : 0

  return {
    section,
    label,
    total,
    pending,
    removed,
    changed,
    photos,
    changedPercent,
  }
}

function summarizeRing(pieces: Piece[], section: Section, ring: string): RingProgressSummary {
  const ringPieces = pieces.filter((p) => p.section === section && p.ring === ring)
  const total = ringPieces.length
  let pending = 0
  let removed = 0
  let changed = 0

  for (const piece of ringPieces) {
    if (piece.state === 'P') {
      pending += 1
    } else if (piece.state === 'R') {
      removed += 1
    } else {
      changed += 1
    }
  }

  const changedPercent = total > 0 ? Math.round((changed / total) * 100) : 0
  const removedPercent = total > 0 ? Math.round((removed / total) * 100) : 0

  return {
    ring,
    section,
    total,
    pending,
    removed,
    changed,
    changedPercent,
    removedPercent,
  }
}

function resolveCurrentPlanTarget(shiftPlan: ShiftPlanPoint[]): {
  expectedPieces: number
  currentShiftLabel: string
} {
  if (shiftPlan.length === 0) {
    return { expectedPieces: 84, currentShiftLabel: 'Turno actual' }
  }

  let latestReportedIndex = 0
  for (let i = 0; i < shiftPlan.length; i += 1) {
    if (shiftPlan[i].changedCumulative !== undefined) {
      latestReportedIndex = i
    }
  }

  const targetPoint = shiftPlan[latestReportedIndex] ?? shiftPlan[0]
  const nextPoint = shiftPlan[latestReportedIndex + 1]
  const shiftLabel = nextPoint
    ? `${nextPoint.shift} (corte ${targetPoint.shift})`
    : targetPoint.shift

  return {
    expectedPieces: targetPoint.plannedCumulative,
    currentShiftLabel: shiftLabel,
  }
}

let cachedMillRef: Mill | undefined
let cachedMillCodeRef = ''
let cachedShiftPlanRef: ShiftPlanPoint[] | undefined
let cachedMetricsResult: MillKpiMetrics | undefined

export function selectMillKpiMetrics(state: MillStoreState): MillKpiMetrics {
  const activeMill = state.mills[state.activeMillCode] ?? Object.values(state.mills)[0]

  if (
    cachedMetricsResult &&
    cachedMillRef === activeMill &&
    cachedMillCodeRef === state.activeMillCode &&
    cachedShiftPlanRef === state.shiftPlan
  ) {
    return cachedMetricsResult
  }

  const pieces = activeMill?.pieces ?? []
  const totalPieces = pieces.length

  const shell = summarizeSection(pieces, 'shell', 'Shell')
  const feed = summarizeSection(pieces, 'feed', 'Tapa de alimentación')
  const discharge = summarizeSection(pieces, 'discharge', 'Tapa de descarga')

  const pendingCount = shell.pending + feed.pending + discharge.pending
  const removedCount = shell.removed + feed.removed + discharge.removed
  const changedCount = shell.changed + feed.changed + discharge.changed
  const photoCount = shell.photos + feed.photos + discharge.photos

  const changedPercent =
    totalPieces > 0 ? Math.round((changedCount / totalPieces) * 1000) / 10 : 0

  const { expectedPieces, currentShiftLabel } = resolveCurrentPlanTarget(state.shiftPlan)
  const planDelta = changedCount - expectedPieces
  const isOnTrack = changedCount >= expectedPieces

  const shellRings = SHELL_RINGS.map((ring) => summarizeRing(pieces, 'shell', ring))
  const feedRings = FEED_RINGS.map(({ ring }) => summarizeRing(pieces, 'feed', ring))
  const dischargeRings = DISCHARGE_RINGS.map(({ ring }) =>
    summarizeRing(pieces, 'discharge', ring),
  )

  const result: MillKpiMetrics = {
    millCode: activeMill?.code ?? state.activeMillCode,
    millName: activeMill?.name ?? state.activeMillCode,
    site: activeMill?.site ?? 'Sierra Gorda',
    shutdown: activeMill?.shutdown ?? 'SD-2026-11 Cambio de revestimientos',
    totalPieces,
    pendingCount,
    removedCount,
    changedCount,
    photoCount,
    changedPercent,
    expectedPieces,
    currentShiftLabel,
    planDelta,
    isOnTrack,
    shell,
    feed,
    discharge,
    shellRings,
    feedRings,
    dischargeRings,
  }

  cachedMillRef = activeMill
  cachedMillCodeRef = state.activeMillCode
  cachedShiftPlanRef = state.shiftPlan
  cachedMetricsResult = result

  return result
}

export interface PiecesSCurveData {
  categories: string[]
  plannedSeries: (number | null)[]
  removedSeries: (number | null)[]
  changedSeries: (number | null)[]
  totalPieces: number
  currentChanged: number
  currentRemovedTotal: number
  expectedPieces: number
}

export interface ShutdownSCurveData {
  categories: string[]
  plannedPercentSeries: number[]
  realPercentSeries: (number | null)[]
  realAccumulatedPercent: number
  plannedAccumulatedPercent: number
  deviationPercent: number
  spi: number
  isBehind: boolean
  reportedShiftsCount: number
  totalShiftsCount: number
  totalPlannedHours: number
  totalEarnedHours: number
}

export interface MilestoneWithDuration extends Milestone {
  durationHours: number
}

export interface MilestoneGroup {
  summary: MilestoneWithDuration
  children: MilestoneWithDuration[]
}

export interface GanttActivityItem {
  id: string
  parentId?: string
  name: string
  start: string
  end: string
  startHour: number
  endHour: number
  durationHours: number
  progress: number
  isSummary: boolean
}

export interface GanttChartData {
  baseTimestamp: number
  totalHours: number
  currentHour: number
  currentShiftLabel: string
  items: GanttActivityItem[]
}

function parseTimestampMs(isoLocal: string): number {
  const parsed = Date.parse(isoLocal)
  return Number.isNaN(parsed) ? Date.now() : parsed
}

export function calculateDurationHours(start: string, end: string): number {
  const diffMs = parseTimestampMs(end) - parseTimestampMs(start)
  const rawHours = diffMs / (1000 * 3600)
  return Math.max(0.5, Math.round(rawHours * 10) / 10)
}

let cachedPiecesCurveMillRef: Mill | undefined
let cachedPiecesCurveShiftRef: ShiftPlanPoint[] | undefined
let cachedPiecesCurveResult: PiecesSCurveData | undefined

export function selectPiecesSCurveData(state: MillStoreState): PiecesSCurveData {
  const activeMill = state.mills[state.activeMillCode] ?? Object.values(state.mills)[0]

  if (
    cachedPiecesCurveResult &&
    cachedPiecesCurveMillRef === activeMill &&
    cachedPiecesCurveShiftRef === state.shiftPlan
  ) {
    return cachedPiecesCurveResult
  }

  const metrics = selectMillKpiMetrics(state)
  const currentChanged = metrics.changedCount
  const currentRemovedTotal = metrics.removedCount + metrics.changedCount
  const baseRatio = metrics.totalPieces > 0 ? currentChanged / 84 : 0

  const categories: string[] = []
  const plannedSeries: (number | null)[] = []
  const removedSeries: (number | null)[] = []
  const changedSeries: (number | null)[] = []

  let lastReportedIdx = 0
  for (let i = 0; i < state.shiftPlan.length; i += 1) {
    if (state.shiftPlan[i].changedCumulative !== undefined) {
      lastReportedIdx = i
    }
  }

  for (let i = 0; i < state.shiftPlan.length; i += 1) {
    const point = state.shiftPlan[i]
    categories.push(point.shift)
    plannedSeries.push(point.plannedCumulative)

    if (i < lastReportedIdx && point.changedCumulative !== undefined) {
      const scaledChanged = Math.min(
        currentChanged,
        Math.round(point.changedCumulative * Math.min(1, baseRatio)),
      )
      const rawRemoved = point.removedCumulative ?? point.changedCumulative
      const scaledRemoved = Math.min(
        currentRemovedTotal,
        Math.max(scaledChanged, Math.round(rawRemoved * Math.min(1, baseRatio))),
      )
      changedSeries.push(scaledChanged)
      removedSeries.push(scaledRemoved)
    } else if (i === lastReportedIdx) {
      changedSeries.push(currentChanged)
      removedSeries.push(currentRemovedTotal)
    } else {
      changedSeries.push(null)
      removedSeries.push(null)
    }
  }

  categories[lastReportedIdx] = `${categories[lastReportedIdx]} · Actual`

  const result: PiecesSCurveData = {
    categories,
    plannedSeries,
    removedSeries,
    changedSeries,
    totalPieces: metrics.totalPieces,
    currentChanged,
    currentRemovedTotal,
    expectedPieces: metrics.expectedPieces,
  }

  cachedPiecesCurveMillRef = activeMill
  cachedPiecesCurveShiftRef = state.shiftPlan
  cachedPiecesCurveResult = result

  return result
}

function resolveBaseShutdownMs(milestones: Milestone[]): number {
  if (milestones.length === 0) {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0).getTime()
  }
  let minMs = Number.POSITIVE_INFINITY
  for (const ms of milestones) {
    const startMs = parseTimestampMs(ms.start)
    if (startMs < minMs) {
      minMs = startMs
    }
  }
  return Number.isFinite(minMs) ? minMs : Date.now()
}

function getLeafActivities(milestones: Milestone[]): MilestoneWithDuration[] {
  const parentIds = new Set<string>()
  for (const item of milestones) {
    if (item.parentId) {
      parentIds.add(item.parentId)
    }
  }

  return milestones
    .filter((item) => item.parentId !== undefined || !parentIds.has(item.id))
    .map((item) => ({
      ...item,
      durationHours: calculateDurationHours(item.start, item.end),
    }))
}

let cachedShutdownMilestonesRef: Milestone[] | undefined
let cachedShutdownShiftPlanRef: ShiftPlanPoint[] | undefined
let cachedShutdownCurveResult: ShutdownSCurveData | undefined

export function selectShutdownSCurveData(state: MillStoreState): ShutdownSCurveData {
  if (
    cachedShutdownCurveResult &&
    cachedShutdownMilestonesRef === state.milestones &&
    cachedShutdownShiftPlanRef === state.shiftPlan
  ) {
    return cachedShutdownCurveResult
  }

  const baseMs = resolveBaseShutdownMs(state.milestones)
  const leafActivities = getLeafActivities(state.milestones)

  const totalPlannedHours = Math.max(
    1,
    leafActivities.reduce((acc, item) => acc + item.durationHours, 0),
  )

  const totalEarnedHours = leafActivities.reduce(
    (acc, item) => acc + item.durationHours * (item.progress / 100),
    0,
  )

  let latestReportedIdx = 0
  let reportedShiftsCount = 0
  for (let i = 0; i < state.shiftPlan.length; i += 1) {
    if (state.shiftPlan[i].changedCumulative !== undefined) {
      latestReportedIdx = i
      if (state.shiftPlan[i].hoursElapsed > 0) {
        reportedShiftsCount += 1
      }
    }
  }

  const evaluationShiftIdx = Math.min(state.shiftPlan.length - 1, latestReportedIdx + 1)
  const categories: string[] = []
  const plannedPercentSeries: number[] = []
  const realPercentSeries: (number | null)[] = []

  for (let i = 0; i < state.shiftPlan.length; i += 1) {
    const point = state.shiftPlan[i]
    categories.push(point.shift)

    const cutoffHour = point.hoursElapsed
    let plannedHoursByCutoff = 0
    let earnedHoursByCutoff = 0

    for (const act of leafActivities) {
      const startHour = Math.max(0, (parseTimestampMs(act.start) - baseMs) / (1000 * 3600))
      const overlap = Math.min(act.durationHours, Math.max(0, cutoffHour - startHour))
      plannedHoursByCutoff += overlap

      const actEarnedHours = act.durationHours * (act.progress / 100)
      if (i < evaluationShiftIdx) {
        earnedHoursByCutoff += Math.min(actEarnedHours, overlap)
      } else {
        earnedHoursByCutoff += actEarnedHours
      }
    }

    const plannedPct =
      i === state.shiftPlan.length - 1
        ? 100
        : Math.min(100, Math.round((plannedHoursByCutoff / totalPlannedHours) * 1000) / 10)
    plannedPercentSeries.push(plannedPct)

    if (i === 0) {
      realPercentSeries.push(0)
    } else if (i <= evaluationShiftIdx) {
      const realPct = Math.min(
        100,
        Math.round((earnedHoursByCutoff / totalPlannedHours) * 1000) / 10,
      )
      realPercentSeries.push(realPct)
    } else {
      realPercentSeries.push(null)
    }
  }

  const realAccumulatedPercent = Math.min(
    100,
    Math.round((totalEarnedHours / totalPlannedHours) * 1000) / 10,
  )
  const plannedAccumulatedPercent =
    plannedPercentSeries[evaluationShiftIdx] ??
    plannedPercentSeries[latestReportedIdx] ??
    33.3

  const deviationPercent =
    Math.round((realAccumulatedPercent - plannedAccumulatedPercent) * 10) / 10

  const spi =
    plannedAccumulatedPercent > 0
      ? Math.round((realAccumulatedPercent / plannedAccumulatedPercent) * 100) / 100
      : 1

  const totalShiftsCount = Math.max(1, state.shiftPlan.filter((p) => p.hoursElapsed > 0).length)

  const result: ShutdownSCurveData = {
    categories,
    plannedPercentSeries,
    realPercentSeries,
    realAccumulatedPercent,
    plannedAccumulatedPercent,
    deviationPercent,
    spi,
    isBehind: spi < 1,
    reportedShiftsCount,
    totalShiftsCount,
    totalPlannedHours: Math.round(totalPlannedHours * 10) / 10,
    totalEarnedHours: Math.round(totalEarnedHours * 10) / 10,
  }

  cachedShutdownMilestonesRef = state.milestones
  cachedShutdownShiftPlanRef = state.shiftPlan
  cachedShutdownCurveResult = result

  return result
}

let cachedGroupMilestonesRef: Milestone[] | undefined
let cachedMilestoneGroupsResult: MilestoneGroup[] | undefined

export function selectMilestoneGroups(state: MillStoreState): MilestoneGroup[] {
  if (cachedMilestoneGroupsResult && cachedGroupMilestonesRef === state.milestones) {
    return cachedMilestoneGroupsResult
  }

  const summaries = state.milestones.filter((m) => !m.parentId)
  const childrenByParent = new Map<string, MilestoneWithDuration[]>()

  for (const item of state.milestones) {
    if (item.parentId) {
      const list = childrenByParent.get(item.parentId) ?? []
      list.push({
        ...item,
        durationHours: calculateDurationHours(item.start, item.end),
      })
      childrenByParent.set(item.parentId, list)
    }
  }

  const groups: MilestoneGroup[] = summaries.map((summary) => {
    const children = childrenByParent.get(summary.id) ?? []
    return {
      summary: {
        ...summary,
        durationHours: calculateDurationHours(summary.start, summary.end),
      },
      children,
    }
  })

  cachedGroupMilestonesRef = state.milestones
  cachedMilestoneGroupsResult = groups

  return groups
}

let cachedGanttMilestonesRef: Milestone[] | undefined
let cachedGanttShiftPlanRef: ShiftPlanPoint[] | undefined
let cachedGanttResult: GanttChartData | undefined

export function selectGanttChartData(state: MillStoreState): GanttChartData {
  if (
    cachedGanttResult &&
    cachedGanttMilestonesRef === state.milestones &&
    cachedGanttShiftPlanRef === state.shiftPlan
  ) {
    return cachedGanttResult
  }

  const baseTimestamp = resolveBaseShutdownMs(state.milestones)
  const groups = selectMilestoneGroups(state)
  const items: GanttActivityItem[] = []
  let maxEndHour = 72

  for (const group of groups) {
    const summaryStartHour = Math.max(
      0,
      Math.round(((parseTimestampMs(group.summary.start) - baseTimestamp) / (1000 * 3600)) * 10) /
        10,
    )
    const summaryEndHour = Math.max(
      summaryStartHour + 0.5,
      Math.round(((parseTimestampMs(group.summary.end) - baseTimestamp) / (1000 * 3600)) * 10) /
        10,
    )
    if (summaryEndHour > maxEndHour) {
      maxEndHour = summaryEndHour
    }

    items.push({
      id: group.summary.id,
      name: group.summary.name,
      start: group.summary.start,
      end: group.summary.end,
      startHour: summaryStartHour,
      endHour: summaryEndHour,
      durationHours: group.summary.durationHours,
      progress: group.summary.progress,
      isSummary: true,
    })

    for (const child of group.children) {
      const startHour = Math.max(
        0,
        Math.round(((parseTimestampMs(child.start) - baseTimestamp) / (1000 * 3600)) * 10) / 10,
      )
      const endHour = Math.max(
        startHour + 0.5,
        Math.round(((parseTimestampMs(child.end) - baseTimestamp) / (1000 * 3600)) * 10) / 10,
      )
      if (endHour > maxEndHour) {
        maxEndHour = endHour
      }

      items.push({
        id: child.id,
        parentId: child.parentId,
        name: child.name,
        start: child.start,
        end: child.end,
        startHour,
        endHour,
        durationHours: child.durationHours,
        progress: child.progress,
        isSummary: false,
      })
    }
  }

  let reportedHours = 28
  let currentShiftLabel = 'Día 2'
  for (let i = 0; i < state.shiftPlan.length; i += 1) {
    if (state.shiftPlan[i].changedCumulative !== undefined) {
      reportedHours = state.shiftPlan[i].hoursElapsed + 4
      currentShiftLabel = state.shiftPlan[i + 1]?.shift ?? state.shiftPlan[i].shift
    }
  }

  const result: GanttChartData = {
    baseTimestamp,
    totalHours: Math.max(72, Math.ceil(maxEndHour)),
    currentHour: Math.min(maxEndHour, Math.max(1, reportedHours)),
    currentShiftLabel,
    items,
  }

  cachedGanttMilestonesRef = state.milestones
  cachedGanttShiftPlanRef = state.shiftPlan
  cachedGanttResult = result

  return result
}
