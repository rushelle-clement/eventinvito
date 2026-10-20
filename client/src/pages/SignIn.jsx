// Sign In page — based on the Stitch "Sign In" screen.

import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import FormAlert from '../components/FormAlert'
import InvitationShowcase from '../components/InvitationShowcase'

export default function SignIn() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={redirectTo} replace />

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    // Read what is actually in the boxes. When the browser autofills a saved email/password,
    // React isn't told until the page is first clicked, so the state can still be empty on
    // the first press of "Sign In" even though the boxes look filled in.
    const fields = new FormData(e.currentTarget)
    const values = {
      email: String(fields.get('email') ?? form.email),
      password: String(fields.get('password') ?? form.password),
      remember: form.remember,
    }
    setForm(values)

    const errs = {}
    if (!values.email.trim()) errs.email = 'Enter your email address.'
    if (!values.password) errs.password = 'Enter your password.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      await signIn(values)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setFormError(err.message)
      setErrors(err.fieldErrors || {})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout aside={<InvitationShowcase quote="Where every celebration begins with a beautiful invitation." />}>
      <section className="card px-6 py-10 sm:px-10 sm:py-12">
        <p className="eyebrow">
          <span className="h-2 w-2 rounded-full bg-gold" aria-hidden="true" /> Host sign in
        </p>
        <h1 className="mt-4 font-serif text-display-mobile text-espresso sm:text-display">Welcome Back</h1>
        <p className="mt-3 text-body-lg text-on-surface-variant">
          Sign in to manage your invitations, guest lists, and RSVPs.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <FormAlert>{formError}</FormAlert>

          <FormField
            label="Email address"
            icon={Mail}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="e.g. amal@example.com"
            value={form.email}
            onChange={update('email')}
            error={errors.email}
            required
          />

          <FormField
            label="Password"
            icon={LockKeyhole}
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            required
          />

          <label className="flex cursor-pointer items-center gap-3 text-body-md text-on-surface-variant">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={update('remember')}
              className="h-5 w-5 rounded border-bone accent-espresso"
            />
            Keep me signed in on this device
          </label>

          <button type="submit" className="btn-primary w-full py-4 text-title-md" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
            {!submitting && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>

        <p className="mt-8 text-center text-body-md text-on-surface-variant">
          Don&apos;t have an EventInvito account?{' '}
          <Link to="/signup" className="font-semibold text-gold-text underline underline-offset-4 hover:text-primary">
            Create an Account
          </Link>
        </p>
      </section>
    </AuthLayout>
  )
}
