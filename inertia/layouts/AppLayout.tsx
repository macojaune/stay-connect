import React from 'react'
import { Head } from '@inertiajs/react'
import { Navigation } from '~/components/Navigation'
import { usePage } from '@inertiajs/react'
import { Footer } from '~/components/Footer'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function AppLayout({
  children,
  title = 'StayConnect',
  description,
}: AppLayoutProps) {
  return (
    <>
      <Head>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation isLandingPage={usePage().url === '/'} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  )
}
