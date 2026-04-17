import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/common/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
import Accounts from './pages/Accounts'
import Maintainers from './pages/Maintainers'
import MaintenancePlans from './pages/MaintenancePlans'
import WorkOrders from './pages/WorkOrders'
import TimeEntries from './pages/TimeEntries'
import Users from './pages/Users'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
    </div>
  )
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"          element={<Dashboard />} />
        <Route path="assets"             element={<Assets />} />
        <Route path="accounts"           element={<Accounts />} />
        <Route path="maintainers"        element={<Maintainers />} />
        <Route path="maintenance-plans"  element={<MaintenancePlans />} />
        <Route path="work-orders"        element={<WorkOrders />} />
        <Route path="time-entries"       element={<TimeEntries />} />
        <Route path="users"              element={<Users />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
