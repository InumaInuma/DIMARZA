import {
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Maximize2,
  Minimize2,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useMillStore } from '../../store/useMillStore.ts'

export default function ActionToolbar() {
  const focusMode = useMillStore((s) => s.focusMode)
  const toggleFocusMode = useMillStore((s) => s.toggleFocusMode)
  const mills = useMillStore((s) => s.mills)
  const activeMillCode = useMillStore((s) => s.activeMillCode)
  const milestones = useMillStore((s) => s.milestones)
  const incidents = useMillStore((s) => s.incidents)
  const auditLog = useMillStore((s) => s.auditLog)
  const history = useMillStore((s) => s.history)
  const currentUser = useMillStore((s) => s.currentUser)
  const undo = useMillStore((s) => s.undo)
  const reset = useMillStore((s) => s.reset)

  const [exportNotice, setExportNotice] = useState<string | null>(null)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)

  const isMinera = currentUser?.role === 'minera'
  const canUndo = !isMinera && history.length > 0

  const handleExportPlaceholder = (formatLabel: string) => {
    setExportNotice(`${formatLabel}: Disponible en la versión final`)
  }

  const handleDownloadBackupJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      activeMillCode,
      mills,
      milestones,
      incidents,
      auditLog,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `backup-${activeMillCode.toLowerCase()}-shutdown.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const handleConfirmReset = () => {
    reset()
    setConfirmingReset(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleFocusMode}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              focusMode
                ? 'border-sky-600 bg-sky-600 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {focusMode ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
            <span>Modo concentrado</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportPlaceholder('Exportar Excel')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportPlaceholder('Exportar PDF')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <FileText className="h-3.5 w-3.5 text-rose-600" />
            <span>Exportar PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadBackupJson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <Download className="h-3.5 w-3.5 text-sky-600" />
            <span>Backup JSON</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistoryPanel((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              showHistoryPanel
                ? 'border-slate-800 bg-slate-800 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Historial ({auditLog.length})</span>
          </button>

          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Revertir acción</span>
          </button>

          {!confirmingReset ? (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              disabled={isMinera}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1">
              <span className="text-xs font-semibold text-red-800">
                ¿Restaurar estado inicial?
              </span>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-red-700"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {exportNotice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-semibold text-sky-900">
          <span>{exportNotice}</span>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="rounded p-1 text-sky-700 hover:bg-sky-100"
            aria-label="Cerrar aviso"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {showHistoryPanel && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Historial reciente de acciones ({auditLog.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowHistoryPanel(false)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-48 divide-y divide-slate-100 overflow-y-auto text-xs">
            {auditLog.slice(0, 15).map((entry, idx) => (
              <div
                key={`${entry.at}-${idx}`}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div className="font-medium text-slate-800">{entry.action}</div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="font-semibold text-slate-700">{entry.user}</span>
                  <span>·</span>
                  <span>{entry.at}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
