import { DISCHARGE_RINGS, FEED_RINGS, SHELL_RINGS } from '../domain/seed.ts'
import type { Mill, Piece, PieceState, Section, ShiftPlanPoint } from '../domain/types.ts'
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
