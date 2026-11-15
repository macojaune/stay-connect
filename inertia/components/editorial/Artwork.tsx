import { useState } from 'react'

type Props = { src: string | null; name: string; className?: string }

export default function Artwork({ src, name, className = '' }: Props) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  return (
    <span className={`sc-artwork ${className}`} aria-hidden="true">
      <span>{name.slice(0, 2).toUpperCase()}</span>
      {src && src !== failedSource && (
        <img
          src={src}
          alt=""
          width={160}
          height={160}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSource(src)}
        />
      )}
    </span>
  )
}
