import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import { SEED_USERS } from '../domain/seed.ts'
import type { Role } from '../domain/types.ts'
import { ROLE_LABELS } from '../domain/types.ts'
import { useMillStore } from '../store/useMillStore.ts'

interface PermissionRow {
  id: string
  capability: string
  description: string
  roles: Record<Role, boolean>
}

const PERMISSION_ROWS: PermissionRow[] = [
  {
    id: 'view',
    capability: 'Ver tableros (KPIs, Mapeo 2D, Vista 3D, Curvas S y Gantt)',
    description: 'Visualización en tiempo real del avance del shutdown y estado por pieza.',
    roles: { admin: true, supervisor: true, minera: true },
  },
  {
    id: 'change-pieces',
    capability: 'Cambiar piezas (P → R → RC)',
    description: 'Actualizar el estado de revestimientos en Shell, Tapa de alimentación y descarga.',
    roles: { admin: true, supervisor: true, minera: false },
  },
  {
    id: 'upload-photo',
    capability: 'Subir foto de respaldo en pieza',
    description: 'Marcar y adjuntar evidencia fotográfica por placa intervenida.',
    roles: { admin: true, supervisor: true, minera: false },
  },
  {
    id: 'edit-milestones',
    capability: 'Editar hitos e incidencias del turno',
    description: 'Crear, actualizar o eliminar actividades del plan y registrar demoras.',
    roles: { admin: true, supervisor: true, minera: false },
  },
  {
    id: 'export',
    capability: 'Exportar reportes y respaldos (Excel, PDF, JSON)',
    description: 'Descarga de reportes ejecutivos y backup completo del estado del molino.',
    roles: { admin: true, supervisor: true, minera: true },
  },
  {
    id: 'audit',
    capability: 'Ver bitácora de auditoría y matriz de accesos',
    description: 'Revisión del historial detallado de cambios con fecha, hora y usuario.',
    roles: { admin: true, supervisor: true, minera: false },
  },
]

const ROLE_ORDER: Role[] = ['admin', 'supervisor', 'minera']

export default function AccessMatrixPage() {
  const currentUser = useMillStore((s) => s.currentUser)
  const login = useMillStore((s) => s.login)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Matriz de Accesos por Rol</h1>
            <p className="text-sm text-slate-500">
              Permisos de visualización y operación para cada perfil dentro del shutdown.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-slate-400">Simular rol:</span>
          {SEED_USERS.map((user) => {
            const active = currentUser?.id === user.id
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => login(user.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-sky-600 bg-sky-600 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {user.name} ({user.roleLabel})
              </button>
            )
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-4 font-semibold text-slate-700">Capacidad / Acción</th>
              {ROLE_ORDER.map((role) => {
                const isCurrent = currentUser?.role === role
                return (
                  <th key={role} className="px-6 py-4 text-center font-semibold text-slate-700">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span>{ROLE_LABELS[role]}</span>
                      {isCurrent && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                          Rol actual
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {PERMISSION_ROWS.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800">{row.capability}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{row.description}</div>
                </td>
                {ROLE_ORDER.map((role) => {
                  const allowed = row.roles[role]
                  return (
                    <td key={role} className="px-6 py-4 text-center">
                      {allowed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Permitido</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          <XCircle className="h-4 w-4 text-slate-400" />
                          <span>Bloqueado</span>
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
