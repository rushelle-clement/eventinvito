// All the pages in the app and which URL shows each one.

import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Templates from './pages/Templates'
import InvitationEditor from './pages/InvitationEditor'
import InvitationPreview from './pages/InvitationPreview'
import ManageGuests from './pages/ManageGuests'
import MyGuests from './pages/MyGuests'
import GuestInvite from './pages/GuestInvite'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import TemplateDemo from './pages/TemplateDemo'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'
import ScrollToTop from './components/ScrollToTop'
import Admin from './pages/Admin'

// Loaded only when opened: the spreadsheet libraries are large and most visitors never need them
const ImportGuests = lazy(() => import('./pages/ImportGuests'))
const GuestAgenda = lazy(() => import('./pages/GuestAgenda'))
const QrReply = lazy(() => import('./pages/QrReply'))
const AgendaPreview = lazy(() => import('./pages/AgendaPreview'))
const TemplateAgendaDemo = lazy(() => import('./pages/TemplateAgendaDemo'))

const loading = (
  <p className="py-20 text-center text-body-md text-on-surface-variant" role="status">
    Loading…
  </p>
)

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route element={<AppLayout />}>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/templates" element={<Templates />} />
        <Route
          path="/custom-design"
          element={
            <ComingSoon
              eyebrow="Custom design service"
              title="Custom invitations are coming soon"
              message="Soon you’ll be able to choose a package and send us your ideas for an invitation designed just for you."
            />
          }
        />

        {/* Signed-in only */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invitations/new" element={<Navigate to="/templates" replace />} />
          <Route path="/invitations/:id/edit" element={<InvitationEditor />} />
          <Route path="/invitations/:id/guests" element={<ManageGuests />} />
          <Route
            path="/invitations/:id/guests/import"
            element={
              <Suspense fallback={loading}>
                <ImportGuests />
              </Suspense>
            }
          />
          <Route path="/guests" element={<MyGuests />} />
        </Route>

        {/* Admin only: accounts and publish credits */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>

      {/* Full-screen preview, without the site menu */}
      <Route element={<ProtectedRoute />}>
        <Route path="/invitations/:id/preview" element={<InvitationPreview />} />
        <Route path="/invitations/:id/preview/agenda" element={<Suspense fallback={loading}><AgendaPreview /></Suspense>} />
      </Route>

      {/* Full-screen animated demo of a design (from the gallery) */}
      <Route path="/templates/:key/preview" element={<TemplateDemo />} />
      <Route path="/templates/:key/preview/agenda" element={<Suspense fallback={loading}><TemplateAgendaDemo /></Suspense>} />

      {/* A guest's personal invitation link */}
      <Route path="/i/:token" element={<GuestInvite />} />
      <Route path="/i/:token/agenda" element={<Suspense fallback={loading}><GuestAgenda /></Suspense>} />
      {/* Printed cards: the QR code on the card opens this reply page */}
      <Route path="/r/:code" element={<Suspense fallback={loading}><QrReply /></Suspense>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}
