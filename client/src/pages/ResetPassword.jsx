// Choose a new password, from the link in the reset email: /reset-password/<secret>
// On success the couple is signed in and goes to their dashboard; other devices are signed out.

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import FormAlert from '../components/FormAlert'
import InvitationShowcase from '../components/InvitationShowcase'

export default function ResetPassword() {
  const { token } = useParams()
  const { signInWithToken } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // The secret is in the address: keep the page out of search engines and referrer headers
  useEffect(() => {
    const metas = [
      ['robots', 'noindex, nofollow'],
      ['referrer', 'no-referrer'],
    ].map(([name, content]) => {
      const m = document.createElement('meta')
      m.name = name
      m.content = content
      document.head.appendChild(m)
      return m
    })
    return () => metas.forEach((m) => m.remove())
  }, [])

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errs = {}
    if (form.password.length < 8) errs.password = 'Use at least 8 characters.'
    else if (form.password !== form.confirm) errs.confirm = 'The two passwords don’t match.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      const data = await api('/auth/reset-password', { method: 'POST', body: { token, password: form.password }, auth: false })
      signInWithToken(data.token, data.user)
      navigate('/dashboard', { replace: true, state: { passwordChanged: true } })
    } catch (err) {
      if (err.code === 'reset_invalid') setInvalid(true)
      setFormError(err.message)
      setErrors(err.fieldErrors || {})
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout aside={<InvitationShowcase quote="Where every celebration begins with a beautiful invitation." />}>
      <section className="card px-6 py-10 sm:px-10 sm:py-12">
        <p className="eyebrow">
          <span className="h-2 w-2 rounded-full bg-gold" aria-hidden="true" /> New password
        </p>
        <h1 className="mt-4 font-serif text-display-mobile text-espresso sm:text-display">Choose a new password</h1>

        {invalid ? (
          <div className="mt-8">
            <FormAlert>{formError}</FormAlert>
            <Link to="/forgot-password" className="btn-primary mt-6 w-full py-4 text-title-md">
              Get a new link <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 text-body-lg text-on-surface-variant">Pick a password with at least 8 characters. You’ll be signed in here, and signed out on your other devices.</p>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
              <FormAlert>{formError}</FormAlert>
              <FormField
                label="New password"
                icon={LockKeyhole}
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={update('password')}
                error={errors.password}
                required
              />
              <FormField
                label="Type it again"
                icon={LockKeyhole}
                type="password"
                name="confirm"
                autoComplete="new-password"
                placeholder="The same password"
                value={form.confirm}
                onChange={update('confirm')}
                error={errors.confirm}
                required
              />
              <button type="submit" className="btn-primary w-full py-4 text-title-md" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save and sign in'}
                {!submitting && <ArrowRight size={18} aria-hidden="true" />}
              </button>
            </form>
          </>
        )}
      </section>
    </AuthLayout>
  )
}
