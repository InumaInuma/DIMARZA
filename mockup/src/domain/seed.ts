import type {
  AuditEntry,
  Incident,
  Milestone,
  Mill,
  Piece,
  PieceState,
  ShiftPlanPoint,
  UserAccount,
} from './types.ts'

export const SEED_USERS: UserAccount[] = [
  {
    id: 'admin-dimarza',
    name: 'Admin DIMARZA',
    role: 'admin',
    roleLabel: 'Administrador',
    title: 'Jefe de Proyecto Shutdown · DIMARZA',
  },
  {
    id: 'supervisor-turno',
    name: 'Supervisor de turno',
    role: 'supervisor',
    roleLabel: 'Supervisor',
    title: 'Supervisor Operativo Turno Día · DIMARZA',
  },
  {
    id: 'cliente-minera',
    name: 'Cliente Sierra Gorda',
    role: 'minera',
    roleLabel: 'Minera',
    title: 'Confiabilidad Planta Concentradora · Sierra Gorda',
  },
]

export const SHELL_RINGS = [
  'SL R1',
  'SL R2',
  'SL R3',
  'SL R4',
  'SL R5',
  'SL R6',
  'SL R7',
] as const

export const FEED_RINGS: ReadonlyArray<{ ring: string; count: number }> = [
  { ring: 'FIHL', count: 12 },
  { ring: 'FMFL', count: 12 },
  { ring: 'OHL', count: 24 },
]

export const DISCHARGE_RINGS: ReadonlyArray<{ ring: string; count: number }> = [
  { ring: 'DIHL', count: 12 },
  { ring: 'OHL', count: 24 },
]

function buildMillPieces(millCode: string, initialCompletedRings: ReadonlySet<string>): Piece[] {
  const pieces: Piece[] = []

  for (const ring of SHELL_RINGS) {
    const isCompleted = initialCompletedRings.has(ring)
    for (let index = 1; index <= 28; index += 1) {
      const state: PieceState = isCompleted ? 'RC' : 'P'
      pieces.push({
        id: `${millCode}-shell-${ring.replace(/\s+/g, '')}-${index}`,
        section: 'shell',
        ring,
        index,
        state,
        hasPhoto: isCompleted && index % 7 === 0,
        updatedBy: isCompleted ? 'Supervisor de turno' : undefined,
        updatedAt: isCompleted ? '08:30' : undefined,
      })
    }
  }

  for (const { ring, count } of FEED_RINGS) {
    for (let index = 1; index <= count; index += 1) {
      pieces.push({
        id: `${millCode}-feed-${ring}-${index}`,
        section: 'feed',
        ring,
        index,
        state: 'P',
        hasPhoto: false,
      })
    }
  }

  for (const { ring, count } of DISCHARGE_RINGS) {
    for (let index = 1; index <= count; index += 1) {
      pieces.push({
        id: `${millCode}-discharge-${ring}-${index}`,
        section: 'discharge',
        ring,
        index,
        state: 'P',
        hasPhoto: false,
      })
    }
  }

  return pieces
}

export function createSeedMills(): Record<string, Mill> {
  return {
    ML021: {
      code: 'ML021',
      name: 'Molino de Bolas ML021',
      site: 'Sierra Gorda',
      shutdown: 'SD-2026-11 Cambio de revestimientos',
      pieces: buildMillPieces('ML021', new Set(['SL R1', 'SL R2', 'SL R3'])),
    },
    ML022: {
      code: 'ML022',
      name: 'Molino de Bolas ML022',
      site: 'Sierra Gorda',
      shutdown: 'SD-2026-11 Cambio de revestimientos',
      pieces: buildMillPieces('ML022', new Set()),
    },
  }
}

function getTodayBaseAt0700(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0)
}

function addHoursFormatted(base: Date, hoursToAdd: number): string {
  const target = new Date(base.getTime() + hoursToAdd * 3600 * 1000)
  const yyyy = target.getFullYear()
  const mm = String(target.getMonth() + 1).padStart(2, '0')
  const dd = String(target.getDate()).padStart(2, '0')
  const hh = String(target.getHours()).padStart(2, '0')
  const min = String(target.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

export function createSeedMilestones(): Milestone[] {
  const base = getTodayBaseAt0700()

  return [
    {
      id: 'ms-1',
      name: 'Actividades previas',
      start: addHoursFormatted(base, 0),
      end: addHoursFormatted(base, 8),
      progress: 100,
    },
    {
      id: 'ms-1-1',
      parentId: 'ms-1',
      name: 'Bloqueo de equipo (LOTO) y verificación de energía cero',
      start: addHoursFormatted(base, 0),
      end: addHoursFormatted(base, 2),
      progress: 100,
    },
    {
      id: 'ms-1-2',
      parentId: 'ms-1',
      name: 'Retiro de protecciones y chute de alimentación',
      start: addHoursFormatted(base, 2),
      end: addHoursFormatted(base, 5),
      progress: 100,
    },
    {
      id: 'ms-1-3',
      parentId: 'ms-1',
      name: 'Armado de andamios y ventilación interior',
      start: addHoursFormatted(base, 5),
      end: addHoursFormatted(base, 8),
      progress: 100,
    },

    {
      id: 'ms-2',
      name: 'Instalación de máquina lainera',
      start: addHoursFormatted(base, 8),
      end: addHoursFormatted(base, 14),
      progress: 100,
    },
    {
      id: 'ms-2-1',
      parentId: 'ms-2',
      name: 'Ingreso y posicionamiento de viga central',
      start: addHoursFormatted(base, 8),
      end: addHoursFormatted(base, 10),
      progress: 100,
    },
    {
      id: 'ms-2-2',
      parentId: 'ms-2',
      name: 'Anclaje, nivelación y montaje de brazo manipulador',
      start: addHoursFormatted(base, 10),
      end: addHoursFormatted(base, 12),
      progress: 100,
    },
    {
      id: 'ms-2-3',
      parentId: 'ms-2',
      name: 'Conexión de unidad hidráulica y pruebas operativas',
      start: addHoursFormatted(base, 12),
      end: addHoursFormatted(base, 14),
      progress: 100,
    },

    {
      id: 'ms-3',
      name: 'Cambio de revestimientos',
      start: addHoursFormatted(base, 14),
      end: addHoursFormatted(base, 64),
      progress: 30,
    },
    {
      id: 'ms-3-1',
      parentId: 'ms-3',
      name: 'Desmontaje y montaje Shell (anillos SL R1 a SL R3)',
      start: addHoursFormatted(base, 14),
      end: addHoursFormatted(base, 28),
      progress: 100,
    },
    {
      id: 'ms-3-2',
      parentId: 'ms-3',
      name: 'Desmontaje y montaje Shell (anillos SL R4 a SL R7)',
      start: addHoursFormatted(base, 28),
      end: addHoursFormatted(base, 46),
      progress: 0,
    },
    {
      id: 'ms-3-3',
      parentId: 'ms-3',
      name: 'Desmontaje y montaje Tapa de alimentación (FIHL, FMFL, OHL)',
      start: addHoursFormatted(base, 46),
      end: addHoursFormatted(base, 56),
      progress: 0,
    },
    {
      id: 'ms-3-4',
      parentId: 'ms-3',
      name: 'Desmontaje y montaje Tapa de descarga (DIHL, OHL)',
      start: addHoursFormatted(base, 56),
      end: addHoursFormatted(base, 64),
      progress: 0,
    },

    {
      id: 'ms-4',
      name: 'Giro N° 0 y entrega',
      start: addHoursFormatted(base, 64),
      end: addHoursFormatted(base, 72),
      progress: 0,
    },
    {
      id: 'ms-4-1',
      parentId: 'ms-4',
      name: 'Desmontaje y retiro de máquina lainera y limpieza',
      start: addHoursFormatted(base, 64),
      end: addHoursFormatted(base, 67),
      progress: 0,
    },
    {
      id: 'ms-4-2',
      parentId: 'ms-4',
      name: 'Inspección de torque final y ejecución de Giro N° 0',
      start: addHoursFormatted(base, 67),
      end: addHoursFormatted(base, 70),
      progress: 0,
    },
    {
      id: 'ms-4-3',
      parentId: 'ms-4',
      name: 'Desbloqueo departamental y entrega a Operaciones',
      start: addHoursFormatted(base, 70),
      end: addHoursFormatted(base, 72),
      progress: 0,
    },
  ]
}

export function createSeedIncidents(): Incident[] {
  return [
    {
      id: 'inc-1',
      shift: 'Día 1 (07:00–19:00)',
      time: '09:40',
      description: 'Espera de grúa puente de planta para retiro de chute de alimentación.',
      minutes: 35,
    },
    {
      id: 'inc-2',
      shift: 'Noche 1 (19:00–07:00)',
      time: '22:15',
      description: 'Pernos agripados en anillo SL R2 requirieron corte con equipo oxicorte.',
      minutes: 45,
    },
    {
      id: 'inc-3',
      shift: 'Día 2 (07:00–19:00)',
      time: '11:10',
      description: 'Ajuste de presión en manguera secundaria de máquina lainera.',
      minutes: 20,
    },
  ]
}

export const SEED_SHIFT_PLAN: ShiftPlanPoint[] = [
  { id: 'sp-0', shift: 'Inicio', hoursElapsed: 0, plannedCumulative: 0, removedCumulative: 0, changedCumulative: 0 },
  { id: 'sp-1', shift: 'Día 1', hoursElapsed: 12, plannedCumulative: 28, removedCumulative: 34, changedCumulative: 28 },
  { id: 'sp-2', shift: 'Noche 1', hoursElapsed: 24, plannedCumulative: 84, removedCumulative: 84, changedCumulative: 84 },
  { id: 'sp-3', shift: 'Día 2', hoursElapsed: 36, plannedCumulative: 140 },
  { id: 'sp-4', shift: 'Noche 2', hoursElapsed: 48, plannedCumulative: 196 },
  { id: 'sp-5', shift: 'Día 3', hoursElapsed: 60, plannedCumulative: 244 },
  { id: 'sp-6', shift: 'Noche 3', hoursElapsed: 72, plannedCumulative: 280 },
]

export function createSeedAuditLog(): AuditEntry[] {
  return [
    {
      at: '2026-11-08 08:30:12',
      user: 'Supervisor de turno',
      action: 'Completó anillo SL R3 en ML021 (84 / 280 piezas en RC)',
    },
    {
      at: '2026-11-08 07:15:00',
      user: 'Admin DIMARZA',
      action: 'Inició turno Día 2 en Shutdown SD-2026-11 · Sierra Gorda',
    },
  ]
}
