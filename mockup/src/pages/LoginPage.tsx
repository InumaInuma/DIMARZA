import { ArrowRight, HardHat, Shield, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SEED_USERS } from '../domain/seed.ts'
import type { Role } from '../domain/types.ts'
import { useMillStore } from '../store/useMillStore.ts'

const ROLE_BADGE_CLASSES: Record<Role, string> = {
  admin: 'bg-sky-100 text-sky-800 border-sky-200',
  supervisor: 'bg-amber-100 text-amber-800 border-amber-200',
  minera: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Acceso total: cambio de piezas, fotos, gestión de hitos, exportación y bitácora.',
  supervisor: 'Control operativo en turno: actualización de piezas, fotos, hitos e incidencias.',
  minera: 'Vista de solo lectura en tiempo real de KPIs, mapeo 2D, modelo 3D y avance.',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useMillStore((s) => s.login)
  const currentUser = useMillStore((s) => s.currentUser)

  const handleSelectUser = (userId: string) => {
    login(userId)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12 text-slate-100">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/90 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-300">
            <span>DIMARZA · Plataforma de Shutdown</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Reportabilidad Cambio de Revestimientos
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sierra Gorda · Molino ML021 · SD-2026-11 · Seleccione un perfil para ingresar sin contraseña
          </p>
        </div>

        <div className="space-y-4">
          {SEED_USERS.map((user) => {
            const isSelected = currentUser?.id === user.id
            const Icon =
              user.role === 'admin' ? Shield : user.role === 'supervisor' ? HardHat : UserCheck

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelectUser(user.id)}
                className={`group flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-sky-500 bg-slate-800/90 ring-2 ring-sky-500/30'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sky-400 group-hover:bg-sky-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-white">{user.name}</span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE_CLASSES[user.role]}`}
                      >
                        {user.roleLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">{user.title}</p>
                    <p className="mt-1.5 text-xs text-slate-300">{ROLE_DESCRIPTIONS[user.role]}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white transition-transform group-hover:translate-x-0.5 group-hover:bg-sky-500">
                  <span>Ingresar</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
