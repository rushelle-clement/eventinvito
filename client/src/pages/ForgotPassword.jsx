// Forgot password: the couple enters their email and gets a one-time reset link.
// The answer is the same whether or not the email has an account.

import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Mail, MailCheck } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import FormAlert from '../components/FormAlert'
import InvitationShowcase from '../components/InvitationShowcase'
import ContactLine from '../components/ContactLine'

export default function ForgotPassword() {
  const { user } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.email || '')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [sent, setSent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const value = String(new FormData(e.currentTarget).get('email') ?? email).trim()
    setEmail(value)
    if (!value) return setError('Enter your email address.')
    setSubmitting(true)
    try {
      const data = await api('/auth/forgot-password', { method: 'POST', body: { email: value }, auth: false })
      setSent(data.message)
    } catch (err) {
      setFormError(err.message)
      setError(err.fieldErrors?.email || '')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout aside={<InvitationShowcase quote="Where every celebration begins with a beautiful invitation." />}>
      <section className="card px-6 py-10 sm:px-10 sm:py-12">
        <p className="eyebrow">
          <span className="h-2 w-2 rounded-full bg-gold" aria-hidden="true" /> Forgot password
        </p>
        <h1 className="mt-4 font-serif text-display-mobile text-espresso sm:text-display">Reset your password</h1>

        {sent ? (
          <div className="mt-8" role="status">
            <div className="flex items-start gap-4 rounded-xl border border-gold/40 bg-blush-tint px-5 py-5">
              <MailCheck size={22} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
              <div>
                <p className="text-body-lg text-espresso">Check your email</p>
                <p className="mt-1 text-body-md text-on-surface-variant">{sent}</p>
                <p className="mt-1 text-body-sm text-on-surface-variant">Sent to {email}</p>
              </div>
            </div>
            <p className="mt-6 text-body-md text-on-surface-variant">
              No email after a few minutes?{' '}
              <button type="button" className="font-semibold text-gold-text underline underline-offset-4 hover:text-primary" onClick={() => setSent('')}>
                Try again
              </button>
              , or contact us:
            </p>
            <ContactLine className="mt-2" />
          </div>
        ) : (
          <>
            <p className="mt-3 text-body-lg text-on-surface-variant">Enter the email you use for EventInvito and we’ll send you a link to choose a new password.</p>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
              <FormAlert>{formError}</FormAlert>
              <FormField
                label="Email address"
                icon={Mail}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="e.g. amal@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                error={error}
                required
              />
              <button type="submit" className="btn-primary w-full py-4 text-title-md" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send reset link'}
                {!submitting && <ArrowRight size={18} aria-hidden="true" />}
              </button>
            </form>
          </>
        )}

        <p className="mt-8 text-center text-body-md">
          <Link to="/signin" className="inline-flex items-center gap-1.5 font-semibold text-gold-text underline-offset-4 hover:text-primary hover:underline">
            <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
          </Link>
        </p>
      </section>
    </AuthLayout>
  )
}
