import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  createSeedAuditLog,
  createSeedIncidents,
  createSeedMilestones,
  createSeedMills,
  SEED_SHIFT_PLAN,
  SEED_USERS,
} from '../domain/seed.ts'
import type {
  AuditEntry,
  Incident,
  Milestone,
  Mill,
  PieceState,
  ShiftPlanPoint,
  UserAccount,
} from '../domain/types.ts'

interface DomainSnapshot {
  mills: Record<string, Mill>
  milestones: Milestone[]
  incidents: Incident[]
}

export interface MillStoreState {
  mills: Record<string, Mill>
  activeMillCode: string
  currentUser: UserAccount | null
  milestones: Milestone[]
  incidents: Incident[]
  shiftPlan: ShiftPlanPoint[]
  auditLog: AuditEntry[]
  history: DomainSnapshot[]
  connectedUsers: number
  focusMode: boolean

  login: (userId: string) => void
  logout: () => void
  setActiveMill: (code: string) => void
  toggleFocusMode: () => void
  cyclePiece: (pieceId: string) => void
  togglePhoto: (pieceId: string) => void
  addMilestone: (milestone: Omit<Milestone, 'id'>) => void
  updateMilestone: (id: string, patch: Partial<Omit<Milestone, 'id'>>) => void
  deleteMilestone: (id: string) => void
  addIncident: (incident: Omit<Incident, 'id'>) => void
  undo: () => void
  reset: () => void
}

const NEXT_PIECE_STATE: Record<PieceState, PieceState> = {
  P: 'R',
  R: 'RC',
  RC: 'P',
}

function formatNowTimestamp(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
}

function formatShortTime(): string {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${hh}:${min}`
}

function cloneSnapshot(state: Pick<MillStoreState, 'mills' | 'milestones' | 'incidents'>): DomainSnapshot {
  return {
    mills: structuredClone(state.mills),
    milestones: structuredClone(state.milestones),
    incidents: structuredClone(state.incidents),
  }
}

function recalculateSummaryMilestones(milestones: Milestone[]): Milestone[] {
  const childrenByParent = new Map<string, Milestone[]>()
  for (const item of milestones) {
    if (item.parentId) {
      const list = childrenByParent.get(item.parentId) ?? []
      list.push(item)
      childrenByParent.set(item.parentId, list)
    }
  }

  return milestones.map((item) => {
    if (item.parentId) {
      return item
    }
    const children = childrenByParent.get(item.id)
    if (!children || children.length === 0) {
      return item
    }
    const avgProgress = Math.round(
      children.reduce((acc, child) => acc + child.progress, 0) / children.length,
    )
    return {
      ...item,
      progress: avgProgress,
    }
  })
}

interface SyncPayload {
  mills: Record<string, Mill>
  milestones: Milestone[]
  incidents: Incident[]
  auditLog: AuditEntry[]
  activeMillCode: string
}

type BroadcastMessage =
  | { type: 'hello'; tabId: string }
  | { type: 'heartbeat'; tabId: string }
  | { type: 'bye'; tabId: string }
  | { type: 'sync-state'; tabId: string; payload: SyncPayload }

const TAB_ID = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
let syncChannel: BroadcastChannel | null = null

function emitSyncState(state: Pick<MillStoreState, 'mills' | 'milestones' | 'incidents' | 'auditLog' | 'activeMillCode'>): void {
  if (!syncChannel) {
    return
  }
  const message: BroadcastMessage = {
    type: 'sync-state',
    tabId: TAB_ID,
    payload: {
      mills: state.mills,
      milestones: state.milestones,
      incidents: state.incidents,
      auditLog: state.auditLog,
      activeMillCode: state.activeMillCode,
    },
  }
  syncChannel.postMessage(message)
}

export const useMillStore = create<MillStoreState>()(
  persist(
    (set, get) => ({
      mills: createSeedMills(),
      activeMillCode: 'ML021',
      currentUser: null,
      milestones: createSeedMilestones(),
      incidents: createSeedIncidents(),
      shiftPlan: SEED_SHIFT_PLAN,
      auditLog: createSeedAuditLog(),
      history: [],
      connectedUsers: 1,
      focusMode: false,

      login: (userId: string) => {
        const found = SEED_USERS.find((u) => u.id === userId)
        if (!found) {
          return
        }
        const entry: AuditEntry = {
          at: formatNowTimestamp(),
          user: found.name,
          action: `Inició sesión con rol ${found.roleLabel}`,
        }
        set((state) => ({
          currentUser: found,
          auditLog: [entry, ...state.auditLog],
        }))
      },

      logout: () => {
        set({ currentUser: null, focusMode: false })
      },

      setActiveMill: (code: string) => {
        const state = get()
        if (!state.mills[code]) {
          return
        }
        set({ activeMillCode: code })
      },

      toggleFocusMode: () => {
        set((state) => ({ focusMode: !state.focusMode }))
      },

      cyclePiece: (pieceId: string) => {
        const state = get()
        if (!state.currentUser || state.currentUser.role === 'minera') {
          return
        }
        const activeMill = state.mills[state.activeMillCode]
        if (!activeMill) {
          return
        }
        const targetPiece = activeMill.pieces.find((p) => p.id === pieceId)
        if (!targetPiece) {
          return
        }

        const snapshot = cloneSnapshot(state)
        const nextState = NEXT_PIECE_STATE[targetPiece.state]
        const userName = state.currentUser.name
        const shortTime = formatShortTime()

        const updatedPieces = activeMill.pieces.map((piece) =>
          piece.id === pieceId
            ? {
                ...piece,
                state: nextState,
                updatedBy: userName,
                updatedAt: shortTime,
              }
            : piece,
        )

        const nextMills: Record<string, Mill> = {
          ...state.mills,
          [state.activeMillCode]: {
            ...activeMill,
            pieces: updatedPieces,
          },
        }

        const entry: AuditEntry = {
          at: formatNowTimestamp(),
          user: userName,
          action: `${activeMill.code} · Pieza ${targetPiece.ring} #${targetPiece.index} cambió de ${targetPiece.state} a ${nextState}`,
        }

        const nextAuditLog = [entry, ...state.auditLog]

        set({
          mills: nextMills,
          auditLog: nextAuditLog,
          history: [snapshot, ...state.history.slice(0, 29)],
        })

        emitSyncState({
          mills: nextMills,
          milestones: state.milestones,
          incidents: state.incidents,
          auditLog: nextAuditLog,
          activeMillCode: state.activeMillCode,
        })
      },

      togglePhoto: (pieceId: string) => {
        const state = get()
        if (!state.currentUser || state.currentUser.role === 'minera') {
          return
        }
        const activeMill = state.mills[state.activeMillCode]
        if (!activeMill) {
          return
        }
        const targetPiece = activeMill.pieces.find((p) => p.id === pieceId)
        if (!targetPiece) {
          return
        }

        const snapshot = cloneSnapshot(state)
        const nextPhoto = !targetPiece.hasPhoto
        const userName = state.currentUser.name
        const shortTime = formatShortTime()

        const updatedPieces = activeMill.pieces.map((piece) =>
          piece.id === pieceId
            ? {
                ...piece,
                hasPhoto: nextPhoto,
                updatedBy: userName,
                updatedAt: shortTime,
              }
            : piece,
        )

        const nextMills: Record<string, Mill> = {
          ...state.mills,
          [state.activeMillCode]: {
            ...activeMill,
            pieces: updatedPieces,
          },
        }

        const entry: AuditEntry = {
          at: formatNowTimestamp(),
          user: userName,
          action: `${activeMill.code} · ${nextPhoto ? 'Adjuntó foto en' : 'Quitó foto de'} pieza ${targetPiece.ring} #${targetPiece.index}`,
        }

        const nextAuditLog = [entry, ...state.auditLog]

        set({
          mills: nextMills,
          auditLog: nextAuditLog,
          history: [snapshot, ...state.history.slice(0, 29)],
        })

        emitSyncState({
          mills: nextMills,
          milestones: state.milestones,
          incidents: state.incidents,
          auditLog: nextAuditLog,
          activeMillCode: state.activeMillCode,
        })
      },

      addMilestone: (milestoneInput: Omit<Milestone, 'id'>) => {
        const state = get()
        if (!state.currentUser || state.currentUser.role === 'minera') {
          return
        }
        const snapshot = cloneSnapshot(state)
        const newMilestone: Milestone = {
          ...milestoneInput,
          id: `ms-${Date.now()}`,
          progress: Math.min(100, Math.max(0, milestoneInput.progress)),
        }
        const nextMilestones = recalculateSummaryMilestones([...state.milestones, newMilestone])
        const entry: AuditEntry = {
          at: formatNowTimestamp(),
          user: state.currentUser.name,
          action: `Agregó actividad "${newMilestone.name}"`,
        }
        const nextAuditLog = [entry, ...state.auditLog]

        set({
          milestones: nextMilestones,
          auditLog: nextAuditLog,
          history: [snapshot, ...state.history.slice(0, 29)],
        })

        emitSyncState({
          mills: state.mills,
          milestones: nextMilestones,
          incidents: state.incidents,
          auditLog: nextAuditLog,
          activeMillCode: state.activeMillCode,
        })
      },

      updateMilestone: (id: string, patch: Partial<Omit<Milestone, 'id'>>) => {
        const state = get()
        if (!state.currentUser || state.currentUser.role === 'minera') {
          return
        }
        const target = state.milestones.find((m) => m.id === id)
        if (!target) {
          return
        }
        const snapshot = cloneSnapshot(state)
        const rawUpdated = state.milestones.map((m) =>
          m.id === id
            ? {
                ...m,
                ...patch,
                progress:
                  patch.progress !== undefined
                    ? Math.min(100, Math.max(0, patch.progress))
                    : m.progress,
              }
            : m,
        )
        const nextMilestones = recalculateSummaryMilestones(rawUpdated)
        const entry: AuditEntry = {
          at: formatNowTimestamp(),
          user: state.currentUser.name,
          action: `Actualizó hito "${target.name}" (${patch.progress !== undefined ? `${patch.progress}%` : 'datos'})`,
        }
        const nextAuditLog = [entry, ...state.auditLog]

        set({
          milestones: nextMilestones,
          auditLog: nextAuditLog,
          history: [snapshot, ...state.history.slice(0, 29)],
        })

        emitSyncState({
          mills: state.mills,
          milestones: nextMilestones,
          incidents: state.incidents,
          auditLog: nextAuditLog,
          activeMillCode: state.activeMillCode,
        })
      },

      deleteMilestone: (id: string) => {
        const state = get()
        if (!state.currentUser || state.currentUser.role === 'minera') {
          return
        }
        const target = state.milestones.find((m) => m.id === id)
        if (!target) {
          return
        }
        const snapshot = cloneSnapshot(state)
        const filtered = state.milestones.filter((m) => m.id !== id && m.parentId !== id)
        const nextMilestones = recalculateSummaryMilestones(filtered)
        const entry: AuditEntry = {
          at: formatNowTimestamp(),
          user: state.currentUser.name,
          action: `Eliminó hito "${target.name}"`,
        }
        const nextAuditLog = [entry, ...state.auditLog]

        set({
          milestones: nextMilestones,
          auditLog: nextAuditLog,
          history: [snapshot, ...state.history.slice(0, 29)],
        })

        emitSyncState({
          mills: state.mills,
          milestones: nextMilestones,
          incidents: state.incidents,
          auditLog: nextAuditLog,
          activeMillCode: state.activeMillCode,
        })
      },

      addIncident: (incidentInput: Omit<Incident, 'id'>) => {
        const state = get()
        if (!state.currentUser || state.currentUser.role === 'minera') {
          return
        }
        const snapshot = cloneSnapshot(state)
        const newIncident: Incident = {
          ...incidentInput,
          id: `inc-${Date.now()}`,
        }
        const nextIncidents = [newIncident, ...state.incidents]
        const entry: AuditEntry = {
          at: formatNowTimestamp(),
          user: state.currentUser.name,
          action: `Registró incidencia (${newIncident.minutes} min): ${newIncident.description}`,
        }
        const nextAuditLog = [entry, ...state.auditLog]

        set({
          incidents: nextIncidents,
          auditLog: nextAuditLog,
          history: [snapshot, ...state.history.slice(0, 29)],
        })

        emitSyncState({
          mills: state.mills,
          milestones: state.milestones,
          incidents: nextIncidents,
          auditLog: nextAuditLog,
          activeMillCode: state.activeMillCode,
        })
      },

      undo: () => {
        const state = get()
        if (!state.currentUser || state.currentUser.role === 'minera') {
          return
        }
        const [previous, ...remainingHistory] = state.history
        if (!previous) {
          return
        }
        const entry: AuditEntry = {
          at: formatNowTimestamp(),
          user: state.currentUser.name,
          action: 'Revirtió la última acción registrada',
        }
        const nextAuditLog = [entry, ...state.auditLog]

        set({
          mills: previous.mills,
          milestones: previous.milestones,
          incidents: previous.incidents,
          history: remainingHistory,
          auditLog: nextAuditLog,
        })

        emitSyncState({
          mills: previous.mills,
          milestones: previous.milestones,
          incidents: previous.incidents,
          auditLog: nextAuditLog,
          activeMillCode: state.activeMillCode,
        })
      },

      reset: () => {
        const state = get()
        if (!state.currentUser || state.currentUser.role === 'minera') {
          return
        }
        const nextMills = createSeedMills()
        const nextMilestones = createSeedMilestones()
        const nextIncidents = createSeedIncidents()
        const entry: AuditEntry = {
          at: formatNowTimestamp(),
          user: state.currentUser.name,
          action: 'Restauró los datos iniciales de fábrica del shutdown',
        }
        const nextAuditLog = [entry, ...createSeedAuditLog()]

        set({
          mills: nextMills,
          milestones: nextMilestones,
          incidents: nextIncidents,
          history: [],
          auditLog: nextAuditLog,
        })

        emitSyncState({
          mills: nextMills,
          milestones: nextMilestones,
          incidents: nextIncidents,
          auditLog: nextAuditLog,
          activeMillCode: state.activeMillCode,
        })
      },
    }),
    {
      name: 'dimarza-mill-store-v1',
      partialize: (state) => ({
        mills: state.mills,
        activeMillCode: state.activeMillCode,
        currentUser: state.currentUser,
        milestones: state.milestones,
        incidents: state.incidents,
        auditLog: state.auditLog,
      }),
    },
  ),
)

if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  const activePeers = new Map<string, number>()
  activePeers.set(TAB_ID, Date.now())

  const channel = new BroadcastChannel('dimarza-sync')
  syncChannel = channel

  const updatePeerCount = () => {
    const now = Date.now()
    activePeers.set(TAB_ID, now)
    for (const [peerId, lastSeen] of activePeers.entries()) {
      if (peerId !== TAB_ID && now - lastSeen > 5000) {
        activePeers.delete(peerId)
      }
    }
    const count = Math.max(1, activePeers.size)
    if (useMillStore.getState().connectedUsers !== count) {
      useMillStore.setState({ connectedUsers: count })
    }
  }

  channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
    const msg = event.data
    if (!msg || typeof msg !== 'object' || msg.tabId === TAB_ID) {
      return
    }

    if (msg.type === 'hello') {
      activePeers.set(msg.tabId, Date.now())
      updatePeerCount()
      channel.postMessage({ type: 'heartbeat', tabId: TAB_ID } satisfies BroadcastMessage)
      return
    }

    if (msg.type === 'heartbeat') {
      activePeers.set(msg.tabId, Date.now())
      updatePeerCount()
      return
    }

    if (msg.type === 'bye') {
      activePeers.delete(msg.tabId)
      updatePeerCount()
      return
    }

    if (msg.type === 'sync-state') {
      activePeers.set(msg.tabId, Date.now())
      useMillStore.setState({
        mills: msg.payload.mills,
        milestones: msg.payload.milestones,
        incidents: msg.payload.incidents,
        auditLog: msg.payload.auditLog,
      })
      updatePeerCount()
    }
  }

  channel.postMessage({ type: 'hello', tabId: TAB_ID } satisfies BroadcastMessage)

  window.setInterval(() => {
    channel.postMessage({ type: 'heartbeat', tabId: TAB_ID } satisfies BroadcastMessage)
    updatePeerCount()
  }, 2000)

  window.addEventListener('beforeunload', () => {
    channel.postMessage({ type: 'bye', tabId: TAB_ID } satisfies BroadcastMessage)
  })
}
