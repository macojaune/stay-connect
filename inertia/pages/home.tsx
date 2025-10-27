import React from 'react'
import { Head, useForm } from '@inertiajs/react'
import AppLayout from '~/layouts/AppLayout'
import Timeline from '~/components/Timeline'
import type { InferPageProps } from '@adonisjs/inertia/types'
import type HomeController from '#controllers/home_controller'
import { Input } from '~/components/ui/Input'
import { FormEvent, useMemo, useState } from 'react'
import { objectify } from 'radash'
import { Button } from '~/components/ui/Button'

type HomeProps = InferPageProps<HomeController, 'index'> & {
  errors?: { [key: string]: string }
  artists: string[]
  remainingArtistsCount: number
}

export default function Home({ errors, timelineData, artists, remainingArtistsCount }: HomeProps) {
  const [userSuccess, setUserSuccess] = useState(false)
  const [artistSuccess, setArtistSuccess] = useState(false)
  const userForm = useForm({ type: 'user', username: '', email: '' })
  const artistForm = useForm({ type: 'artist', email: '', artistName: '', role: '' })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    userForm.post('/newsletter', {
      preserveScroll: true,
      onSuccess: () => {
        userForm.reset()
        setUserSuccess(true)
        setTimeout(() => setUserSuccess(false), 5000)
      },
      onError: (e) => {
        userForm.setError('email', e)
      },
    })
  }
  const handleArtistSubmit = (e: FormEvent) => {
    e.preventDefault()
    artistForm.post('/newsletter', {
      preserveScroll: true,
      onSuccess: () => {
        artistForm.reset()
        setArtistSuccess(true)
        setTimeout(() => setArtistSuccess(false), 5000)
      },
    })
  }
  // const fieldErrors = useMemo(() => {
  //   if (!!errors) return objectify(errors, (e) => e?.field)
  //   return errors
  // }, [errors])

  return (
    <AppLayout>
      <Head>{/* Page-specific meta tags can be added here if needed */}</Head>
      <div className="w-full">
        <div className="flex flex-col items-center">
          {/* Hero Section */}
          <section className="flex flex-row w-full min-h-screen">
            <div className="flex flex-col items-center justify-center px-4 md:px-12 w-full md:w-3/5 py-8 md:py-24 gap-4">
              <h1 className="text-brand md:mt-10 flex items-center md:text-6xl font-semibold text-5xl leading-5 md:leading-6">
                #StayConnect
                <small className="bg-brand/5 text-xs ml-2 md:ml-3 rounded-full px-2 font-medium md:leading-6">
                  ALPHA
                </small>
              </h1>
              <p className="text-2xl text-center md:text-left md:text-3xl mt-4 font-semibold leading-6 tracking-tight md:leading-10 md:tracking-tighter text-zinc-900 text-balance">
                Ne rate plus aucune sortie musicale aux Antilles-Guyane
              </p>
              <p className="text-lg md:text-base md:leading-tight text-zinc-600">
                Je sais pas pour toi, mais j'en avais marre, chaque vendredi, de chercher les
                sorties 97 ou de louper les nouvelles pépites dès leurs débuts.
                <br />
                Et puis, j'ai grandi avec <b>KalottLyrikal</b> moi…
                <br />
                Du coup, j'ai décidé de créer ce site pour répertorier tout ça et aider les artistes
                à promouvoir leurs sorties.
                <br />
                <br />
                Ça devrait ressembler à ça :{' '}
                <i className="text-sm">en moins laid, je ne suis pas UI designer 😅</i>
              </p>
              {/* Timeline Section in Hero */}
              <div className="md:mt-8 w-full md:max-w-2xl">
                <Timeline sections={timelineData} />
              </div>

              <button
                onClick={() => {
                  document.querySelector('#newsletter-section')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
                className="md:mt-8 px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors duration-200 font-medium"
                data-umami-event="newsletter-cta-click"
                data-umami-event-section="hero"
              >
                S'inscrire à la newsletter
              </button>
              <p className="text-sm text-center text-zinc-500 ">
                Inscris-toi à la newsletter pour suivre l'évolution du projet.
              </p>
            </div>

            <div className="grow bg-grain relative md:w-2/5 w-full hidden md:flex">
              <div className="bg-gradient-to-br from-brand/25 to-brand/60 z-10 inset-0 absolute" />
              <img
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1587582140428-38110de9f434?q=80"
              />
            </div>
          </section>

          {/* For Public Section */}
          <section className="w-full py-20 bg-zinc-100">
            <div className="max-w-6xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-center mb-12">Pour le Public</h2>
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">
                    Toutes les sorties musicales à un endroit
                  </h3>
                  <p className="text-zinc-600">
                    Plus besoin de chercher sur plusieurs plateformes, retrouvez toutes les
                    nouveautés musicales en un clic.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Du contenu plus approfondi</h3>
                  <p className="text-zinc-600">
                    Découvre de nouveaux talents et suis tes artistes préférés facilement. Rentre
                    plus en profondeur dans l'univers autour de chaque sortie des artistes.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Et bien plus</h3>
                  <p className="text-zinc-600">
                    Partenariats, exclusivités et bien plus encore en préparation.
                  </p>
                </div>
              </div>

              {/* Artist Tags Section */}
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-6 text-zinc-800">
                  Artistes présents sur la plateforme
                </h3>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {artists.map((artistName, index) => (
                    <span
                      key={index}
                      className="inline-block bg-white px-3 py-1 rounded-full text-sm font-medium text-zinc-700 shadow-sm border border-zinc-200 hover:bg-zinc-50 transition-colors duration-200"
                    >
                      {artistName}
                    </span>
                  ))}
                  {remainingArtistsCount > 0 && (
                    <span className="inline-block bg-brand/10 px-3 py-1 rounded-full text-sm font-medium text-brand border border-brand/20">
                      et {remainingArtistsCount} autres…
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">
                  Découvrez tous les talents des Antilles-Guyane sur notre plateforme
                </p>
              </div>
            </div>
          </section>

          {/* For Artists Section */}
          <section className="w-full py-20  overflow-hidden bg-brand">
            <div className="max-w-6xl mx-auto px-6 relative">
              <h2 className="text-4xl text-white font-bold text-center mb-12">Pour les Artistes</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl text-white font-semibold mb-4">Engagement Direct</h3>
                  <p className="text-zinc-200 ">
                    Un nouveau moyen de mettre en avant ta musique et d'interagir directement avec
                    ton public.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl text-white font-semibold mb-4">
                    Le meilleur est à venir
                  </h3>
                  <p className="text-zinc-200">
                    De nombreuses fonctionnalités sont prévues et en cours de développement,
                    inscris-toi dès maintenant pour participer à leurs tests et faire partie des
                    pionnier·es de la plateforme.
                  </p>
                </div>
              </div>
            </div>
          </section>
          {/* Forms Section */}
          <section className="w-full py-20 bg-zinc-50" id="newsletter-section">
            <div className="max-w-4xl mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Rejoignez la Communauté</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Que vous soyez passionné·e de musique ou artiste, rejoignez notre communauté dès
                  maintenant
                </p>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {/* General User Lead Form */}
                <form
                  onSubmit={handleSubmit}
                  className="group relative rounded-2xl p-6 sm:p-8 bg-white shadow-lg flex flex-col"
                >
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4 text-center">
                    Passionné·es de musique
                  </h3>
                  <p className="text-sm text-center mb-4 text-brand-lightest">
                    Rejoins la newsletter en attendant la v1.
                  </p>

                  {userSuccess && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm text-center">
                      🎉 Merci ! Tu es maintenant inscrit·e à la newsletter.
                    </div>
                  )}

                  <div className="space-y-3 flex flex-col h-full">
                    <Input
                      id="username"
                      type="text"
                      name="username"
                      placeholder="macojaune"
                      label="Nom d'utilisateur"
                      value={userForm.data.username}
                      onChange={(e) => userForm.setData('username', e.target.value)}
                      error={userForm.errors?.username}
                      required
                    />
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="hello@macojaune.com"
                      label="E-mail"
                      value={userForm.data.email}
                      onChange={(e) => userForm.setData('email', e.target.value)}
                      error={userForm.errors?.email}
                      required
                    />

                    <Button
                      type="submit"
                      className="mt-auto"
                      disabled={userForm.processing}
                      data-umami-event="newsletter-submit"
                      data-umami-event-type="user"
                    >
                      {userForm.processing ? 'Inscription...' : 'Rejoindre'}
                    </Button>
                  </div>
                </form>

                {/* Artist Lead Form */}
                <form
                  onSubmit={handleArtistSubmit}
                  method="post"
                  className="group relative rounded-2xl p-6 sm:p-8 bg-brand shadow-lg flex flex-col"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">
                    Artiste ou Équipe
                  </h3>
                  <p className="text-sm text-center mb-4 text-brand-lightest">
                    Rejoins la communauté d'artistes.
                  </p>

                  {artistSuccess && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm text-center">
                      🎵 Parfait ! Bienvenue dans la communauté d'artistes.
                    </div>
                  )}

                  <div className="space-y-3 flex flex-col h-full">
                    <Input
                      id="artistName"
                      type="text"
                      name="artistName"
                      label="Nom de l'artiste"
                      placeholder="ex: Don Snoop"
                      value={artistForm.data.artistName}
                      onChange={(e) => artistForm.setData('artistName', e.target.value)}
                      error={artistForm?.errors?.artistName}
                      required
                    />
                    <Input
                      id="role"
                      type="text"
                      name="role"
                      label="Role du contact"
                      placeholder="ex: Artiste, Manager, Attaché de presse..."
                      value={artistForm.data.role}
                      onChange={(e) => artistForm.setData('role', e.target.value)}
                      error={artistForm?.errors?.role}
                      required
                    />
                    <Input
                      id="artistEmail"
                      type="email"
                      name="email"
                      label='E-mail'
                      placeholder="gel@ayo.gwo"
                      value={artistForm.data.email}
                      onChange={(e) => artistForm.setData('email', e.target.value)}
                      error={artistForm?.errors?.email}
                      required
                    />

                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={artistForm.processing}
                      data-umami-event="newsletter-submit"
                      data-umami-event-type="artist"
                    >
                      {artistForm.processing ? 'Inscription...' : 'Rejoindre'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
