// The day plan of a gallery demo: /templates/<key>/preview/agenda, opened from the "Day plan"
// button on the sample invitation. Sample timings around the current time, so visitors see what
// guests see on the day.

import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AgendaView from '../components/AgendaView'
import { THEMES, sampleInvitation } from '../templates/themes'
import { OCCASIONS } from '../templates/strings'
import SampleWatermark from '../components/SampleWatermark'
import { sampleAgenda } from '../lib/agenda'

const BAR_HEIGHT = 56

export default function TemplateAgendaDemo() {
  const { key } = useParams()
  const [params] = useSearchParams()
  const occasion = OCCASIONS.some((o) => o.value === params.get('occasion')) ? params.get('occasion') : 'wedding'
  const theme = THEMES[key]
  const invitation = useMemo(() => {
    if (!theme) return null
    const sample = sampleInvitation(key, occasion)
    return { ...sample, ...sampleAgenda(sample.language) }
  }, [key, occasion, theme])

  const back = `/templates/${key}/preview?occasion=${occasion}`
  // Free designs are simple cards without a day plan; private custom designs aren't shown here
  if (!invitation || theme.free || theme.custom || theme.birthday) {
    return (
      <div className="mx-auto max-w-xl px-margin-mobile py-16 text-center">
        <p className="text-body-md text-on-surface-variant">This design doesn’t have a day plan.</p>
        <Link to="/templates" className="btn-secondary mt-6">
          Back to designs
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[80] border-b border-bone bg-ivory/95 backdrop-blur" style={{ height: BAR_HEIGHT }}>
        <div className="mx-auto flex h-full max-w-5xl items-center gap-3 px-3">
          <Link to={back} className="btn-secondary shrink-0 px-3 py-1.5 text-body-sm">
            <ArrowLeft size={15} aria-hidden="true" /> <span className="hidden sm:inline">Invitation</span>
          </Link>
          <p className="min-w-0 flex-1 truncate text-center text-body-sm text-on-surface-variant">
            Sample day plan, as guests see it during the ceremony — part of Premium Plus and Signature
          </p>
        </div>
      </div>
      <AgendaView invitation={invitation} backTo={back} topOffset={BAR_HEIGHT} demoNow={invitation.at} />
      <SampleWatermark fixed topOffset={BAR_HEIGHT} />
    </>
  )
}
