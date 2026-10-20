// Wrap pages that need a signed-in user.
// Signed out → sent to /signin, then brought back to the page they wanted.
// role="admin" → also requires the admin role.

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ role }) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center text-body-md text-on-surface-variant" role="status">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />
  }

  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
