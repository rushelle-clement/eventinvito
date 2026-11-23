// The QR code for physical cards: switch it on or off, see who replied with it, and download the
// code to print (Premium Plus, Signature and Printed Cards). Used on the invitation's QR code page.

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, ExternalLink, Info, Lock, QrCode } from 'lucide-react'
import { api } from '../lib/api'
import { copyText } from '../lib/share'
import { invitationTitle } from '../templates/strings'
import { siteUrl } from '../lib/siteUrl'
import { qrInitials } from '../lib/qrStrings'
import { downloadQr, drawQr } from '../lib/qrImage'
import { qrLockNote } from '../lib/accountPlan'
import { useAuth } from '../context/AuthContext'

// Physical cards: one QR code for the whole invitation (Premium Plus and Signature).
// Guests marked "Physical card" scan it, find their name and reply.
export default function QrPanel({ invitation, physical, viaQr, live, physicalOnly, onSaved, onError }) {
  const { user } = useAuth()
  const qr = invitation.qr || { enabled: false, code: '' }
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef(null)
  const url = qr.code ? `${siteUrl()}/r/${qr.code}` : ''
  const initials = qrInitials(invitation)

  useEffect(() => {
    if (qr.enabled && url && canvasRef.current) drawQr(canvasRef.current, url, initials, 480)
  }, [qr.enabled, url, initials])

  async function toggle() {
    setSaving(true)
    try {
      const d = await api(`/invitations/${invitation.id}/qr`, { method: 'PATCH', body: { enabled: !qr.enabled } })
      onSaved(d.qr)
    } catch (err) {
      onError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function copy() {
    if (await copyText(url)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const fileName = `${invitationTitle(invitation).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'invitation'}-QR.png`

  return (
    <section className="card mt-6 p-5" aria-labelledby="qr-panel-h">
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
                <QrCode size={19} />
              </span>
              <div>
                <h2 id="qr-panel-h" className="text-title-md text-espresso">
                  QR code for physical cards
                </h2>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">
                  {physicalOnly ? (
                    'Print this one code on all your cards. Guests scan it, find their name and reply.'
                  ) : (
                    <>
                      Print one code on all your paper cards. Guests marked <strong className="text-espresso">Physical card</strong> scan it, find their name and reply. The switch turns QR replies on or off; guests can only reply once the invitation is published.
                    </>
                  )}
                </p>
              </div>
            </div>
            {/* Printed Cards: the QR code is the whole package, so it's always on (publishing opens it) */}
            {!qr.locked && !physicalOnly && (
            <button
              type="button"
              role="switch"
              aria-checked={qr.enabled}
              aria-labelledby="qr-panel-h"
              onClick={toggle}
              disabled={saving}
              className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${qr.enabled ? 'bg-gold' : 'bg-outline-variant'}`}
            >
              <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${qr.enabled ? 'translate-x-5' : ''}`} aria-hidden="true" />
            </button>
            )}
          </div>

          {/* Printed Cards not paid for yet: the code is handed over once it is */}
          {qr.locked && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-gold/30 bg-blush-tint px-4 py-3 text-body-sm text-espresso">
              <Lock size={16} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
              <p>
                {qrLockNote(user).long}{' '}
                <a href="/#pricing" className="font-semibold text-gold-text underline underline-offset-4">
                  See the package
                </a>
              </p>
            </div>
          )}

          {qr.enabled && !qr.locked && (
            <>
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-espresso">
                <span>
                  <strong>{physical.total}</strong> guest{physical.total === 1 ? '' : 's'} with physical cards
                </span>
                <span>
                  <strong>{viaQr}</strong> replied by QR
                </span>
              </p>
              {physical.total === 0 && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-blush-tint px-4 py-3 text-body-sm text-espresso">
                  <Info size={16} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
                  {physicalOnly
                    ? 'Add your guests, or import them from Excel, using the names written on their cards. Only guests on your list can reply.'
                    : 'Choose “Physical card” when you add a guest, or import a separate Excel file for your physical-card guests. Only they can reply with this code.'}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn-primary px-4 py-2 text-body-sm" onClick={() => downloadQr(url, initials, fileName)}>
                  <Download size={15} aria-hidden="true" /> Download QR (PNG)
                </button>
                <button type="button" className="btn-secondary px-3.5 py-2 text-body-sm" onClick={copy}>
                  {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />} {copied ? 'Copied' : 'Copy link'}
                </button>
                {live && (
                  <a href={url} target="_blank" rel="noreferrer" className="btn-secondary px-3.5 py-2 text-body-sm">
                    <ExternalLink size={15} aria-hidden="true" /> Open reply page
                  </a>
                )}
              </div>
            </>
          )}
          {!qr.enabled && qr.code && (
            <p className="mt-3 text-body-sm text-on-surface-variant">Off: guests who scan the code are asked to contact you. Switch it on again and the same code works.</p>
          )}
        </div>
        {qr.enabled && !qr.locked && (
          <canvas ref={canvasRef} className="h-36 w-36 shrink-0 self-center rounded-md border border-bone md:self-start" role="img" aria-label={`QR code with ${initials || 'your initials'} in the middle`} />
        )}
      </div>
    </section>
  )
}
