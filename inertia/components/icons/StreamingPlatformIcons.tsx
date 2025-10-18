import { useId } from 'react'
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export const SpotifyLogo = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 48 48"
    role="img"
    aria-hidden="true"
    className={className}
    {...props}
  >
    <circle cx={24} cy={24} r={24} fill="#1DB954" />
    <path
      d="M14.8 17.6c6.4-2.2 15.5-1.4 21.5 1.9"
      stroke="#121212"
      strokeWidth={3.4}
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M14.2 23.7c5.5-1.9 13.4-1.1 18.4 2.1"
      stroke="#121212"
      strokeWidth={3}
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M13.7 29.6c4.7-1.6 11.1-0.9 15.2 1.8"
      stroke="#121212"
      strokeWidth={2.6}
      strokeLinecap="round"
      fill="none"
    />
  </svg>
)

export const AppleMusicLogo = ({ className, ...props }: IconProps) => {
  const gradientId = useId()
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={`${gradientId}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB5C74" />
          <stop offset="45%" stopColor="#FA3262" />
          <stop offset="100%" stopColor="#FA233B" />
        </linearGradient>
      </defs>
      <circle cx={24} cy={24} r={24} fill={`url(#${gradientId}-gradient)`} />
      <path
        fill="#fff"
        d="M31 12.8v13.4c0 3-2.1 5.7-5.1 6.4-2.8.7-5.1-.9-5.1-3.5 0-2.7 2.2-4.2 5.1-4.8l2.5-.5v-7.7l-9.5 1.9V26c0 3-2.2 5.7-5.1 6.4-2.8.7-5.1-.9-5.1-3.5 0-2.7 2.1-4.4 5.1-5l1.6-.3V15c0-.9.6-1.7 1.4-1.8l12.2-2.5c1.1-.2 2 .5 2 1.6Z"
      />
    </svg>
  )
}

export const YoutubeLogo = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 48 48"
    role="img"
    aria-hidden="true"
    className={className}
    {...props}
  >
    <rect x={4} y={11} width={40} height={26} rx={8} fill="#FF0000" />
    <path
      d="M30.5 24 20.5 18.5v11L30.5 24Z"
      fill="#fff"
    />
  </svg>
)

export const SoundcloudLogo = ({ className, ...props }: IconProps) => {
  const gradientId = useId()
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={`${gradientId}-cloud`} x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stopColor="#FF8C00" />
          <stop offset="100%" stopColor="#FF5500" />
        </linearGradient>
      </defs>
      <path
        d="M36.4 20.6a6.2 6.2 0 0 0-11.8-2 7.7 7.7 0 0 0-1-0.08c-4.1 0-7.4 3.3-7.4 7.4 0 .4 0 .8.1 1.2-1 .6-1.7 1.7-1.7 3 0 2 1.6 3.6 3.6 3.6h18.2a5.4 5.4 0 0 0 0-10.8Z"
        fill={`url(#${gradientId}-cloud)`}
      />
      <g fill="#fff">
        <rect x={11} y={21} width={1.8} height={12} rx={0.9} />
        <rect x={14} y={19.5} width={1.8} height={13.5} rx={0.9} />
        <rect x={17} y={18} width={1.8} height={15} rx={0.9} />
        <rect x={20} y={17.2} width={1.8} height={15.8} rx={0.9} />
      </g>
    </svg>
  )
}

export const TidalLogo = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 48 48"
    role="img"
    aria-hidden="true"
    className={className}
    {...props}
  >
    <rect width={48} height={48} rx={12} fill="#0A0A0D" />
    <path
      fill="#18BFFF"
      d="m24 12 5.5 5.5-5.5 5.5-5.5-5.5L24 12Zm-11 11 5.5 5.5-5.5 5.5L7.5 28 13 23Zm22 0 5.5 5.5-5.5 5.5-5.5-5.5L35 23Zm-11 11 5.5 5.5L24 40 18.5 34.5 24 29Z"
    />
  </svg>
)

export const DeezerLogo = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 48 48"
    role="img"
    aria-hidden="true"
    className={className}
    {...props}
  >
    <rect width={48} height={48} rx={12} fill="#050505" />
    <g transform="translate(10 16)">
      <rect x={0} y={12} width={5} height={8} rx={1} fill="#FF0000" />
      <rect x={6} y={9} width={5} height={11} rx={1} fill="#FF7A00" />
      <rect x={12} y={6} width={5} height={14} rx={1} fill="#FFED00" />
      <rect x={18} y={3} width={5} height={17} rx={1} fill="#3DD8FF" />
      <rect x={24} y={0} width={5} height={20} rx={1} fill="#2D27FF" />
    </g>
  </svg>
)
