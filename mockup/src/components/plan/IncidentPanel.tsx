import { AlertOctagon, Clock, Lock, PlusCircle } from 'lucide-react'
import { useState } from 'react'
import { useMillStore } from '../../store/useMillStore.ts'

const SHIFT_OPTIONS = [
  'Día 1 (07:00–19:00)',
  'Noche 1 (19:00–07:00)',
  'Día 2 (07:00–19:00)',
  'Noche 2 (19:00–07:00)',
  'Día 3 (07:00–19:00)',
  'Noche 3 (19:00–07:00)',
] as const

export default function IncidentPanel() {
  const incidents = useMillStore((s) => s.incidents)
  const currentUser = useMillStore((s) => s.currentUser)
  const addIncident = useMillStore((s) => s.addIncident)

  const isMinera = currentUser?.role === 'minera'

  const [shift, setShift] = useState<string>('Día 2 (07:00–19:00)')
  const [time, setTime] = useState('14:30')
  const [description, setDescription] = useState('')
  const [minutes, setMinutes] = useState(15)

  const totalMinutes = incidents.reduce((acc, item) => acc + item.minutes, 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = description.trim()
    if (!trimmed || minutes <= 0 || isMinera) {
      return
    }
    addIncident({
      shift,
      time,
      description: trimmed,
      minutes: Math.round(minutes),
    })
    setDescription('')
    setMinutes(15)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Incidencias del Turno</h2>
            <p className="text-xs text-slate-500">
              Registro operativo de desviaciones, detenciones y demoras durante el shutdown
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Eventos: {incidents.length}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 font-bold text-rose-700">
            <Clock className="h-3.5 w-3.5" />
            Demora acumulada: {totalMinutes} min ({totalHours} h)
          </span>
        </div>
      </div>

      {isMinera ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            Vista de solo lectura (Rol Minera): el registro de nuevas incidencias está reservado para Supervisores y Administradores.
          </span>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-12"
        >
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Turno</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
            >
              {SHIFT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Hora</label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-4">
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Descripción de la incidencia
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Espera de puente grúa o cambio de manguera hidráulica"
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Minutos</label>
            <input
              type="number"
              required
              min={1}
              max={720}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end md:col-span-2">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-500"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Registrar</span>
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
        {incidents.map((inc) => (
          <div
            key={inc.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs hover:bg-slate-50/80"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {inc.shift}
                </span>
                <span className="font-mono text-xs font-bold text-slate-600">{inc.time} h</span>
              </div>
              <p className="font-medium text-slate-800">{inc.description}</p>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
              <Clock className="h-3.5 w-3.5" />
              +{inc.minutes} min demora
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
