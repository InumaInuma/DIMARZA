import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout.tsx'
import AccessMatrixPage from './pages/AccessMatrixPage.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import MappingPage from './pages/MappingPage.tsx'
import { useMillStore } from './store/useMillStore.ts'

export default function App() {
  const currentUser = useMillStore((s) => s.currentUser)
  const activeMillCode = useMillStore((s) => s.activeMillCode)
  const mills = useMillStore((s) => s.mills)
  const activeMill = mills[activeMillCode]
  const isMinera = currentUser?.role === 'minera'

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={currentUser ? <AppLayout /> : <Navigate to="/login" replace />}
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/mapeo" element={<MappingPage />} />
          <Route
            path="/vista-3d"
            element={
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <h1 className="text-xl font-bold text-slate-900">Vista 3D</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Modelo tridimensional interactivo del molino {activeMill?.code ?? activeMillCode}.
                </p>
              </div>
            }
          />
          <Route
            path="/plan"
            element={
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <h1 className="text-xl font-bold text-slate-900">Curvas S y Gantt</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Seguimiento de avance acumulado por turno, carta Gantt de hitos e incidencias.
                </p>
              </div>
            }
          />
          <Route
            path="/bitacora"
            element={
              isMinera ? (
                <Navigate to="/" replace />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                  <h1 className="text-xl font-bold text-slate-900">Bitácora</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Registro cronológico de cambios y auditoría del shutdown.
                  </p>
                </div>
              )
            }
          />
          <Route
            path="/accesos"
            element={isMinera ? <Navigate to="/" replace /> : <AccessMatrixPage />}
          />
        </Route>

        <Route path="*" element={<Navigate to={currentUser ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
