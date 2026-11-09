import {
  Activity,
  Box,
  ClipboardList,
  Grid,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ROLE_LABELS } from '../domain/types.ts'
import { useMillStore } from '../store/useMillStore.ts'

export default function AppLayout() {
  const navigate = useNavigate()
  const mills = useMillStore((s) => s.mills)
  const activeMillCode = useMillStore((s) => s.activeMillCode)
  const setActiveMill = useMillStore((s) => s.setActiveMill)
  const currentUser = useMillStore((s) => s.currentUser)
  const connectedUsers = useMillStore((s) => s.connectedUsers)
  const focusMode = useMillStore((s) => s.focusMode)
  const logout = useMillStore((s) => s.logout)

  const activeMill = mills[activeMillCode] ?? Object.values(mills)[0]
  const isMinera = currentUser?.role === 'minera'

  const navItems = [
    { to: '/', label: 'Inicio (KPIs)', icon: LayoutDashboard, visible: true },
    { to: '/mapeo', label: 'Mapeo 2D', icon: Grid, visible: true },
    { to: '/vista-3d', label: 'Vista 3D', icon: Box, visible: true },
    { to: '/plan', label: 'Curvas S y Gantt', icon: Activity, visible: true },
    { to: '/bitacora', label: 'Bitácora', icon: ClipboardList, visible: !isMinera },
    { to: '/accesos', label: 'Accesos por rol', icon: ShieldCheck, visible: !isMinera },
  ]

  const handleSwitchUser = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {!focusMode && (
        <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
          <div className="border-b border-slate-800 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold tracking-wider text-white">DIMARZA</span>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                Etapa 1
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {activeMill?.shutdown ?? 'SD-2026-11 Cambio de revestimientos'}
            </p>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
          </nav>

          <div className="border-t border-slate-800 p-4 text-xs text-slate-400">
            <div className="font-medium text-slate-200">{activeMill?.site ?? 'Sierra Gorda'}</div>
            <div>72 h · Turnos Día / Noche</div>
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm font-medium text-slate-700">
              Sincronizado · {connectedUsers} usuarios conectados · {activeMill?.site ?? 'Sierra Gorda'} · {activeMillCode}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="mill-selector" className="text-xs font-semibold uppercase text-slate-500">
                Molino
              </label>
              <select
                id="mill-selector"
                value={activeMillCode}
                onChange={(e) => setActiveMill(e.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
              >
                {Object.values(mills).map((mill) => (
                  <option key={mill.code} value={mill.code}>
                    {mill.code} — {mill.site}
                  </option>
                ))}
              </select>
            </div>

            {currentUser && (
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800">{currentUser.name}</div>
                  <div className="text-xs text-slate-500">
                    Rol: <span className="font-medium text-slate-700">{ROLE_LABELS[currentUser.role]}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchUser}
                  title="Cambiar de usuario"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Cambiar usuario</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
