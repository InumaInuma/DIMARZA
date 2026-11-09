import {
  Check,
  Download,
  FileSpreadsheet,
  FolderPlus,
  ListChecks,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Fragment, useState } from 'react'
import { calculateDurationHours, selectMilestoneGroups } from '../../store/selectors.ts'
import { useMillStore } from '../../store/useMillStore.ts'

function formatDateTimeDisplay(isoLocal: string): string {
  const [datePart, timePart] = isoLocal.split('T')
  if (!datePart || !timePart) {
    return isoLocal
  }
  const [, month, day] = datePart.split('-')
  return `${day}/${month} ${timePart.slice(0, 5)}`
}

export default function MilestoneManager() {
  const groups = useMillStore(selectMilestoneGroups)
  const milestones = useMillStore((s) => s.milestones)
  const activeMillCode = useMillStore((s) => s.activeMillCode)
  const currentUser = useMillStore((s) => s.currentUser)
  const addMilestone = useMillStore((s) => s.addMilestone)
  const updateMilestone = useMillStore((s) => s.updateMilestone)
  const deleteMilestone = useMillStore((s) => s.deleteMilestone)

  const isMinera = currentUser?.role === 'minera'

  const [notice, setNotice] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newParentId, setNewParentId] = useState<string>(groups[0]?.summary.id ?? '')
  const [newName, setNewName] = useState('')
  const [newStart, setNewStart] = useState(groups[0]?.summary.start ?? '2026-11-08T07:00')
  const [newEnd, setNewEnd] = useState(groups[0]?.summary.end ?? '2026-11-08T11:00')
  const [newProgress, setNewProgress] = useState(0)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editProgress, setEditProgress] = useState(0)

  const handleOpenAddForParent = (parentId: string, defaultStart: string, defaultEnd: string) => {
    setNewParentId(parentId)
    setNewName('')
    setNewStart(defaultStart)
    setNewEnd(defaultEnd)
    setNewProgress(0)
    setShowAddForm(true)
  }

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed || isMinera) {
      return
    }
    addMilestone({
      parentId: newParentId || undefined,
      name: trimmed,
      start: newStart,
      end: newEnd,
      progress: Math.min(100, Math.max(0, newProgress)),
    })
    setNewName('')
    setShowAddForm(false)
  }

  const handleStartEdit = (item: {
    id: string
    name: string
    start: string
    end: string
    progress: number
  }) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditStart(item.start)
    setEditEnd(item.end)
    setEditProgress(item.progress)
  }

  const handleSaveEdit = (id: string) => {
    const trimmed = editName.trim()
    if (!trimmed || isMinera) {
      return
    }
    updateMilestone(id, {
      name: trimmed,
      start: editStart,
      end: editEnd,
      progress: Math.min(100, Math.max(0, editProgress)),
    })
    setEditingId(null)
  }

  const handleBackupMilestones = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      millCode: activeMillCode,
      milestones,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `backup-hitos-${activeMillCode.toLowerCase()}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Gestor de Hitos y Actividades del Shutdown
            </h2>
            <p className="text-xs text-slate-500">
              Estructura agrupada por hito resumen · Editar el % de avance recalcula el SPI, la Curva S y la Carta Gantt
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isMinera && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
              <Lock className="h-3.5 w-3.5" />
              <span>Vista de solo lectura (Rol Minera)</span>
            </span>
          )}

          <button
            type="button"
            onClick={() =>
              setNotice('Descargar plantilla Excel: Disponible en la versión final')
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Descargar plantilla Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setNotice('Importar Excel: Disponible en la versión final')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <Upload className="h-3.5 w-3.5 text-sky-600" />
            <span>Importar Excel</span>
          </button>

          <button
            type="button"
            onClick={handleBackupMilestones}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600" />
            <span>Backup hitos</span>
          </button>

          {!isMinera && (
            <button
              type="button"
              onClick={() =>
                handleOpenAddForParent(
                  groups[0]?.summary.id ?? '',
                  groups[0]?.summary.start ?? '2026-11-08T07:00',
                  groups[0]?.summary.end ?? '2026-11-08T11:00',
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-500"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Agregar actividad</span>
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-900">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded p-1 text-sky-700 hover:bg-sky-100"
            aria-label="Cerrar aviso"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {!isMinera && showAddForm && (
        <form
          onSubmit={handleCreateMilestone}
          className="mb-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-sky-900">
              Nueva actividad o hito resumen
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded p-1 text-slate-500 hover:bg-slate-200/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Agrupar bajo hito resumen
              </label>
              <select
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
              >
                <option value="">(Crear como nuevo Hito Resumen raíz)</option>
                {groups.map((g) => (
                  <option key={g.summary.id} value={g.summary.id}>
                    {g.summary.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Nombre de la actividad
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Inspección y reapriete de pernos"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Inicio</label>
              <input
                type="datetime-local"
                required
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Fin</label>
              <input
                type="datetime-local"
                required
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <span className="font-semibold">
                Duración calculada: {calculateDurationHours(newStart, newEnd)} h
              </span>
              <label className="flex items-center gap-2 font-semibold">
                <span>% Avance inicial:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={newProgress}
                  onChange={(e) => setNewProgress(Number(e.target.value))}
                  className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-center text-xs font-bold"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
              >
                Guardar en el plan
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="px-4 py-3">Hito Resumen / Actividad</th>
              <th className="px-3 py-3">Inicio</th>
              <th className="px-3 py-3">Fin</th>
              <th className="px-3 py-3 text-center">Duración</th>
              <th className="px-4 py-3">Avance (%)</th>
              {!isMinera && <th className="px-3 py-3 text-right">Acciones</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {groups.map((group, groupIdx) => {
              const { summary, children } = group
              const isEditingSummary = editingId === summary.id

              return (
                <Fragment key={summary.id}>
                  <tr className="bg-slate-100/80 font-semibold text-slate-900">
                    <td className="px-4 py-2.5">
                      {isEditingSummary ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded border border-sky-400 bg-white px-2 py-1 text-xs font-semibold text-slate-900"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[11px] font-bold text-white">
                            {groupIdx + 1}
                          </span>
                          <span>{summary.name}</span>
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                            {children.length} act.
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                      {isEditingSummary ? (
                        <input
                          type="datetime-local"
                          value={editStart}
                          onChange={(e) => setEditStart(e.target.value)}
                          className="rounded border border-sky-400 bg-white px-2 py-1 text-xs"
                        />
                      ) : (
                        formatDateTimeDisplay(summary.start)
                      )}
                    </td>

                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                      {isEditingSummary ? (
                        <input
                          type="datetime-local"
                          value={editEnd}
                          onChange={(e) => setEditEnd(e.target.value)}
                          className="rounded border border-sky-400 bg-white px-2 py-1 text-xs"
                        />
                      ) : (
                        formatDateTimeDisplay(summary.end)
                      )}
                    </td>

                    <td className="whitespace-nowrap px-3 py-2.5 text-center font-bold text-slate-800">
                      {isEditingSummary
                        ? `${calculateDurationHours(editStart, editEnd)} h`
                        : `${summary.durationHours} h`}
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full transition-all ${
                              summary.progress >= 100 ? 'bg-emerald-500' : 'bg-sky-600'
                            }`}
                            style={{ width: `${summary.progress}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-bold text-slate-900">
                          {summary.progress}%
                        </span>
                      </div>
                    </td>

                    {!isMinera && (
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        {isEditingSummary ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(summary.id)}
                              title="Guardar cambios"
                              className="rounded bg-emerald-600 p-1 text-white hover:bg-emerald-500"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              title="Cancelar"
                              className="rounded bg-slate-200 p-1 text-slate-700 hover:bg-slate-300"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenAddForParent(summary.id, summary.start, summary.end)
                              }
                              title="Agregar actividad en este hito"
                              className="rounded border border-slate-300 bg-white p-1 text-sky-700 hover:bg-sky-50"
                            >
                              <FolderPlus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(summary)}
                              title="Editar hito resumen"
                              className="rounded border border-slate-300 bg-white p-1 text-slate-700 hover:bg-slate-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMilestone(summary.id)}
                              title="Eliminar hito resumen"
                              className="rounded border border-red-200 bg-white p-1 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>

                  {children.map((child, childIdx) => {
                    const isEditingChild = editingId === child.id
                    return (
                      <tr key={child.id} className="bg-white hover:bg-slate-50/80">
                        <td className="py-2.5 pr-4 pl-9 text-slate-800">
                          {isEditingChild ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full rounded border border-sky-400 bg-white px-2 py-1 text-xs font-medium text-slate-900"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-semibold text-slate-400">
                                {groupIdx + 1}.{childIdx + 1}
                              </span>
                              <span>{child.name}</span>
                            </div>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                          {isEditingChild ? (
                            <input
                              type="datetime-local"
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                              className="rounded border border-sky-400 bg-white px-2 py-1 text-xs"
                            />
                          ) : (
                            formatDateTimeDisplay(child.start)
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                          {isEditingChild ? (
                            <input
                              type="datetime-local"
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                              className="rounded border border-sky-400 bg-white px-2 py-1 text-xs"
                            />
                          ) : (
                            formatDateTimeDisplay(child.end)
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-center font-medium text-slate-700">
                          {isEditingChild
                            ? `${calculateDurationHours(editStart, editEnd)} h`
                            : `${child.durationHours} h`}
                        </td>

                        <td className="px-4 py-2.5">
                          {isMinera ? (
                            <div className="flex items-center gap-2.5">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={`h-full ${
                                    child.progress >= 100 ? 'bg-emerald-500' : 'bg-sky-500'
                                  }`}
                                  style={{ width: `${child.progress}%` }}
                                />
                              </div>
                              <span className="w-10 text-right font-semibold text-slate-800">
                                {child.progress}%
                              </span>
                            </div>
                          ) : isEditingChild ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={editProgress}
                                onChange={(e) => setEditProgress(Number(e.target.value))}
                                className="w-24 accent-sky-600"
                              />
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={editProgress}
                                onChange={(e) => setEditProgress(Number(e.target.value))}
                                className="w-14 rounded border border-sky-400 bg-white px-1.5 py-0.5 text-center text-xs font-bold"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={child.progress}
                                onChange={(e) =>
                                  updateMilestone(child.id, {
                                    progress: Number(e.target.value),
                                  })
                                }
                                aria-label={`Avance de ${child.name}`}
                                className="w-24 cursor-pointer accent-emerald-600"
                              />
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={child.progress}
                                onChange={(e) =>
                                  updateMilestone(child.id, {
                                    progress: Math.min(100, Math.max(0, Number(e.target.value))),
                                  })
                                }
                                className="w-14 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-center text-xs font-bold text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
                              />
                              <span className="text-[11px] font-semibold text-slate-500">%</span>
                            </div>
                          )}
                        </td>

                        {!isMinera && (
                          <td className="whitespace-nowrap px-3 py-2.5 text-right">
                            {isEditingChild ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(child.id)}
                                  title="Guardar cambios"
                                  className="rounded bg-emerald-600 p-1 text-white hover:bg-emerald-500"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  title="Cancelar"
                                  className="rounded bg-slate-200 p-1 text-slate-700 hover:bg-slate-300"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(child)}
                                  title="Editar actividad"
                                  className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteMilestone(child.id)}
                                  title="Eliminar actividad"
                                  className="rounded border border-red-200 bg-white p-1 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
