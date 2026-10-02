import { useState, type ReactNode } from 'react'

type Props = {
  src: string | null | undefined
  alt?: string
  size: number
  loading?: 'eager' | 'lazy'
  children: ReactNode
}

export default function ImageWithFallback({
  src,
  alt = '',
  size,
  loading = 'eager',
  children,
}: Props) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  if (!src || src === failedSource) return <>{children}</>
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading={loading}
      decoding="async"
      ref={(image) => {
        // An SSR image may fail before React attaches its error listener.
        if (image?.complete && image.naturalWidth === 0) setFailedSource(src)
      }}
      onError={() => setFailedSource(src)}
    />
  )
}
