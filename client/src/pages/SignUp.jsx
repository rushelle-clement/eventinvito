// Create Account page — based on the Stitch "Create Account" screen.

import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Circle, IdCard, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import FormAlert from '../components/FormAlert'
import InvitationShowcase from '../components/InvitationShowcase'
import ContactLine from '../components/ContactLine'
import { useSiteConfig } from '../lib/siteConfig'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8 // must match the server rule

const CHECKS = [
  { label: '8+ characters', test: (p) => p.length >= MIN_PASSWORD },
  { label: 'Uppercase', test: (p) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p) => /\d/.test(p) },
]
const STRENGTH = ['Too short', 'Weak', 'Good', 'Strong']

function validate(form) {
  const errs = {}
  if (!form.name.trim()) errs.name = 'Enter your full name.'
  if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address.'
  if (form.password.length < MIN_PASSWORD) errs.password = `Use at least ${MIN_PASSWORD} characters.`
  if (form.confirm !== form.password) errs.confirm = 'Passwords do not match.'
  if (!form.agree) errs.agree = 'Please accept the terms to continue.'
  return errs
}

export default function SignUp() {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', agree: false })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signupOpen, loaded } = useSiteConfig()

  if (user) return <Navigate to="/dashboard" replace />

  // Until online payments are added, accounts are created by the EventInvito team
  if (loaded && !signupOpen) {
    return (
      <AuthLayout aside={<InvitationShowcase quote="A beautiful arrival for your most memorable day." />}>
        <section className="card px-6 py-10 sm:px-10 sm:py-12">
          <p className="eyebrow">
            <span className="h-2 w-2 rounded-full bg-gold" aria-hidden="true" /> Get started
          </p>
          <h1 className="mt-4 font-serif text-display-mobile text-espresso sm:text-display">Let&apos;s create your invitation</h1>
          <p className="mt-3 text-body-lg text-on-surface-variant">
            For now, EventInvito accounts are set up by our team. Contact us and we&apos;ll create yours, then you can design, publish and share your invitation.
          </p>
          <ContactLine className="mt-5 text-body-md" />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/templates" className="btn-primary">
              Browse the designs <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/signin" className="btn-secondary">
              I have an account — Sign In
            </Link>
          </div>
        </section>
      </AuthLayout>
    )
  }

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  const passed = CHECKS.filter((c) => c.test(form.password)).length
  const strength = form.password.length < MIN_PASSWORD ? 0 : passed

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      await signUp({ name: form.name.trim(), email: form.email.trim(), password: form.password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(err.message)
      setErrors(err.fieldErrors || {})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout aside={<InvitationShowcase quote="A beautiful arrival for your most memorable day." />}>
      <section className="card px-6 py-10 sm:px-10 sm:py-12">
        <p className="eyebrow">
          <span className="h-2 w-2 rounded-full bg-gold" aria-hidden="true" /> Start your first invitation
        </p>
        <h1 className="mt-4 font-serif text-display-mobile text-espresso sm:text-display">Create Your Account</h1>
        <p className="mt-3 text-body-lg text-on-surface-variant">
          Design personalised digital invitations and welcome your guests.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <FormAlert>{formError}</FormAlert>

          <FormField
            label="Full name"
            icon={IdCard}
            name="name"
            autoComplete="name"
            placeholder="e.g. Amal Perera"
            value={form.name}
            onChange={update('name')}
            error={errors.name}
            maxLength={100}
            required
          />

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

          <div>
            <FormField
              label="Password"
              icon={LockKeyhole}
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="Create a secure password"
              value={form.password}
              onChange={update('password')}
              error={errors.password}
              maxLength={128}
              required
            />

            {/* Strength meter */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-label-sm uppercase">
                <span className="text-on-surface-variant">Password strength</span>
                <span className="text-gold-text normal-case" aria-live="polite">
                  {form.password ? STRENGTH[strength] : ''}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden="true">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-1 rounded-full ${strength >= i ? 'bg-gold' : 'bg-surface-container-high'}`} />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-body-sm text-on-surface-variant">
                {CHECKS.map((c) => {
                  const ok = c.test(form.password)
                  return (
                    <li key={c.label} className={`flex items-center gap-1.5 ${ok ? 'text-espresso' : ''}`}>
                      {ok ? <Check size={14} className="text-gold-text" aria-hidden="true" /> : <Circle size={12} aria-hidden="true" />}
                      {c.label}
                      <span className="sr-only">{ok ? '(done)' : '(not yet)'}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          <FormField
            label="Confirm password"
            icon={LockKeyhole}
            type="password"
            name="confirm"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={form.confirm}
            onChange={update('confirm')}
            error={errors.confirm}
            required
          />

          <div>
            <label className="flex cursor-pointer items-start gap-3 text-body-md text-on-surface-variant">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={update('agree')}
                aria-invalid={errors.agree ? 'true' : undefined}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-bone accent-espresso"
              />
              I agree to EventInvito&apos;s Terms of Service and Privacy Policy.
            </label>
            {errors.agree && <p className="mt-2 text-body-sm text-error">{errors.agree}</p>}
          </div>

          <button type="submit" className="btn-primary w-full py-4 text-title-md" disabled={submitting}>
            {submitting ? 'Creating your account…' : 'Create Account & Begin'}
            {!submitting && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>

        <p className="mt-8 text-center text-body-md text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/signin" className="font-semibold text-gold-text underline underline-offset-4 hover:text-primary">
            Sign In
          </Link>
        </p>
      </section>
    </AuthLayout>
  )
}
