import { ArrowUpRight, Disc3 } from 'lucide-react'
import '~/css/site-signature.css'

export default function SiteSignature() {
  return (
    <p className="sc-site-signature">
      <Disc3 className="sc-site-signature-record" size={28} strokeWidth={1.5} aria-hidden="true" />
      <span>
        Développé entre deux écoutes par{' '}
        <a href="https://marvinl.com" target="_blank" rel="noopener noreferrer">
          MarvinL.com <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </span>
    </p>
  )
}
