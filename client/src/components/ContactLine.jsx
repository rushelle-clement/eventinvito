// "Contact us" with the email and phone set on the server (CONTACT_EMAIL / CONTACT_PHONE)

import { Mail, Phone } from 'lucide-react'
import { useSiteConfig } from '../lib/siteConfig'

export default function ContactLine({ className = '' }) {
  const { contact } = useSiteConfig()
  if (!contact?.email && !contact?.phone) return null
  const whatsapp = (contact.phone || '').replace(/[^\d]/g, '')
  return (
    <p className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className}`}>
      {contact.email && (
        <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 font-semibold text-gold-text underline underline-offset-4">
          <Mail size={15} aria-hidden="true" /> {contact.email}
        </a>
      )}
      {contact.phone && (
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-gold-text underline underline-offset-4">
          <Phone size={15} aria-hidden="true" /> {contact.phone}
        </a>
      )}
    </p>
  )
}
