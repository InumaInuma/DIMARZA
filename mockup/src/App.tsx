import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout.tsx'
import AccessMatrixPage from './pages/AccessMatrixPage.tsx'
import AuditPage from './pages/AuditPage.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import MappingPage from './pages/MappingPage.tsx'
import Mill3DPage from './pages/Mill3DPage.tsx'
import PlanPage from './pages/PlanPage.tsx'
import { useMillStore } from './store/useMillStore.ts'

export default function App() {
  const currentUser = useMillStore((s) => s.currentUser)
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
          <Route path="/vista-3d" element={<Mill3DPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route
            path="/bitacora"
            element={isMinera ? <Navigate to="/" replace /> : <AuditPage />}
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
