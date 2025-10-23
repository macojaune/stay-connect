import React from 'react'
import { Head, usePage } from '@inertiajs/react'
import { Navigation } from '~/components/Navigation'
import { Footer } from '~/components/Footer'
interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function AppLayout({ children, description }: AppLayoutProps) {
  const { url } = usePage()
  const landingPagePath = url.split('#')[0]?.split('?')[0] || url
  const isLandingPage = landingPagePath === '/' || landingPagePath === ''

  return (
    <>
      <Head>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation isLandingPage={isLandingPage} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  )
}
