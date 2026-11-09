import { ClipboardList, Search, User } from 'lucide-react'
import { useState } from 'react'
import { selectMillKpiMetrics } from '../store/selectors.ts'
import { useMillStore } from '../store/useMillStore.ts'

export default function AuditPage() {
  const auditLog = useMillStore((s) => s.auditLog)
  const metrics = useMillStore(selectMillKpiMetrics)
  const [query, setQuery] = useState('')
  const [userFilter, setUserFilter] = useState('ALL')

  const uniqueUsers = Array.from(new Set(auditLog.map((entry) => entry.user)))

  const filteredEntries = [...auditLog]
    .sort((a, b) => b.at.localeCompare(a.at))
    .filter((entry) => {
      if (userFilter !== 'ALL' && entry.user !== userFilter) {
        return false
      }
      if (!query.trim()) {
        return true
      }
      const normalized = query.trim().toLowerCase()
      return (
        entry.action.toLowerCase().includes(normalized) ||
        entry.user.toLowerCase().includes(normalized) ||
        entry.at.toLowerCase().includes(normalized)
      )
    })

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Bitácora de Auditoría · {metrics.millName}
            </h1>
            <p className="text-xs text-slate-500">
              {metrics.site} · {metrics.shutdown} · Registro cronológico de acciones (más reciente arriba)
            </p>
          </div>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          {filteredEntries.length} de {auditLog.length} registros
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por acción, pieza, hito o usuario…"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 pr-3 pl-9 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="audit-user-filter" className="text-xs font-semibold text-slate-600">
            Usuario:
          </label>
          <select
            id="audit-user-filter"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">Todos los usuarios</option>
            {uniqueUsers.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="px-5 py-3.5">Fecha y hora</th>
              <th className="px-5 py-3.5">Usuario</th>
              <th className="px-5 py-3.5">Acción registrada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredEntries.map((entry, idx) => (
              <tr key={`${entry.at}-${idx}`} className="hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-semibold text-slate-600">
                  {entry.at}
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    {entry.user}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium text-slate-800">{entry.action}</td>
              </tr>
            ))}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-400">
                  No se encontraron registros que coincidan con el filtro aplicado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
