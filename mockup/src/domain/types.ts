export type PieceState = 'P' | 'R' | 'RC'

export type Section = 'shell' | 'feed' | 'discharge'

export type Role = 'admin' | 'supervisor' | 'minera'

export interface Piece {
  id: string
  section: Section
  ring: string
  index: number
  state: PieceState
  hasPhoto: boolean
  updatedBy?: string
  updatedAt?: string
}

export interface Mill {
  code: string
  name: string
  site: string
  shutdown: string
  pieces: Piece[]
}

export interface Milestone {
  id: string
  parentId?: string
  name: string
  start: string
  end: string
  progress: number
}

export interface Incident {
  id: string
  shift: string
  time: string
  description: string
  minutes: number
}

export interface AuditEntry {
  at: string
  user: string
  action: string
}

export interface UserAccount {
  id: string
  name: string
  role: Role
  roleLabel: string
  title: string
}

export interface ShiftPlanPoint {
  id: string
  shift: string
  hoursElapsed: number
  plannedCumulative: number
  removedCumulative?: number
  changedCumulative?: number
}

export const PIECE_STATE_COLORS: Record<PieceState, string> = {
  P: '#9ca3af',
  R: '#facc15',
  RC: '#22c55e',
}

export const PIECE_STATE_LABELS: Record<PieceState, string> = {
  P: 'Pendiente',
  R: 'Retirado',
  RC: 'Retirado y cambiado',
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  minera: 'Minera',
}
