import { Head, useForm } from '@inertiajs/react'
import AppLayout from '../layouts/AppLayout'
import Timeline from '../components/Timeline'
import type { InferPageProps } from '@adonisjs/inertia/types'
import type HomeController from '#controllers/home_controller'
import { Input } from '~/components/ui/Input'
import { Button } from '~/components/ui/Button'
import { FormEvent, useMemo, useState } from 'react'
import { objectify } from 'radash'

type HomeProps = InferPageProps<HomeController, 'index'>

export default function Home({ errors }: HomeProps) {
  const [userSuccess, setUserSuccess] = useState(false)
  const [artistSuccess, setArtistSuccess] = useState(false)
  const userForm = useForm({ type: 'user', username: '', email: '' })
  const artistForm = useForm({ type: 'artist', email: '', artistName: '', role: '' })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    userForm.post('/newsletter', {
      preserveScroll: true,
      preserveUrl: true,
      onSuccess: () => {
        userForm.reset()
        setUserSuccess(true)
        setTimeout(() => setUserSuccess(false), 5000)
      }
    })
  }
  const handleArtistSubmit = (e: FormEvent) => {
    e.preventDefault()
    artistForm.post('/newsletter', {
      preserveScroll: true, onSuccess: () => {
        artistForm.reset()
        setArtistSuccess(true)
        setTimeout(() => setArtistSuccess(false), 5000)
      }
    })
  }
  const fieldErrors = useMemo(() => {
    if (!!errors) return objectify(errors, e => e?.field)
    return errors
  }, [errors])

  return (
    <AppLayout>
      <Head title="StayConnect - Ne rate plus aucune sortie musicale" />
      <div className="w-full">
        <div className="flex flex-col items-center">
          {/* Hero Section */}
          <section className="flex flex-row w-full min-h-screen">
            <div className="flex flex-col items-center justify-center sm:px-12 w-3/5 sm:py-24">
              <h1 className="text-brand mt-10 flex items-center text-6xl font-semibold leading-6">
                #StayConnect
                <small className="bg-brand/5 text-xs ml-3 rounded-full px-2 font-medium leading-6">
                  ALPHA
                </small>
              </h1>
              <p className="text-3xl mt-4 font-semibold leading-10 tracking-tighter text-zinc-900 text-balance">
                Ne rate plus aucune sortie musicale aux Antilles-Guyane
              </p>
              <p className="mt-4 text-base leading-tight text-zinc-600">
                Je sais pas pour toi, mais j’en avais marre, chaque vendredi, de chercher les sorties 97 ou de louper les nouvelles pépites dès leurs débuts.
                <br />
                Et puis, j'ai grandi avec <b>KalottLyrikal</b> moi…
                <br />
                Du coup, j'ai décidé de créer ce site pour répertorier tout ça et aider les artistes à promouvoir leurs sorties.
                <br />
                <br />
                Ça devrait ressembler à ça :
              </p>
              {/* Timeline Section in Hero */}
              <div className="mt-8 w-full max-w-2xl">
                <Timeline />
              </div>
              <button
                onClick={() => {
                  document.querySelector('#newsletter-section')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
                className="mt-8 px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors duration-200 font-medium"
              >
                S'inscrire à la newsletter
              </button>
            </div>


            <div className="grow bg-grain relative w-2/5">
              <div className='bg-gradient-to-br from-brand/25 to-brand/60 z-10 inset-0 absolute' />
              <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1587582140428-38110de9f434?q=80" />
            </div>
          </section>


          {/* For Public Section */}
          <section className="w-full py-20 bg-zinc-100">
            <div className="max-w-6xl mx-auto px-6">
              <h2 className="text-4xl font-bold text-center mb-12">Pour le Public</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">
                    Toutes les sorties musicales à un endroit
                  </h3>
                  <p className="text-zinc-600">
                    Plus besoin de chercher sur plusieurs plateformes, retrouvez toutes les nouveautés musicales en un clic.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-4">
                    Du contenu plus approfondi
                  </h3>
                  <p className="text-zinc-600">
                    Découvre de nouveaux talents et suis tes artistes préférés facilement. Rentre plus en profondeur dans l'univers autour de chaque sortie des artistes.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Et bien plus</h3>
                  <p className="text-zinc-600">
                    Partenariats, exclusivités et bien plus encore en préparation.
                  </p>
                </div>
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
                    Un nouveau moyen de mettre en avant ta musique et d'interagir directement avec ton public.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl text-white font-semibold mb-4">Le meilleur est à venir</h3>
                  <p className="text-zinc-200">
                    De nombreuses fonctionnalités sont prévues et en cours de développement, inscris-toi dès maintenant pour participer à leurs tests et faire partie des pionnier·es de la plateforme.
                  </p>
                </div>
              </div>
            </div>
          </section>
          {/* Forms Section */}
          <section className="w-full py-20 bg-zinc-50" id="newsletter-section">
            <div className="max-w-4xl mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Rejoignez la Communauté
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Que vous soyez passionné·e de musique ou artiste, rejoignez notre communauté dès maintenant
                </p>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {/* General User Lead Form */}
                <form onSubmit={handleSubmit} className="group relative rounded-2xl p-6 sm:p-8 bg-white shadow-lg flex flex-col">
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4 text-center">Passionné·es de musique</h3>
                  <p className="text-sm text-center mb-4 text-brand-lightest">Rejoins la newsletter en attendant la v1.</p>

                  {userSuccess && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm text-center">
                      🎉 Merci ! Tu es maintenant inscrit·e à la newsletter.
                    </div>
                  )}

                  <div className="space-y-3 flex flex-col h-full">
                    <Input
                      type="text"
                      name="username"
                      placeholder='macojaune'
                      label="Nom d'utilisateur"
                      value={userForm.data.username}
                      onChange={(e) => userForm.setData('username', e.target.value)}
                      error={fieldErrors?.username?.message}
                      required
                    />
                    <Input
                      type="email"
                      name="email"
                      placeholder='hello@macojaune.com'
                      label="E-mail"
                      value={userForm.data.email}
                      onChange={(e) => userForm.setData('email', e.target.value)}
                      error={fieldErrors?.email?.message}
                      required
                    />
                    <Button
                      type="submit"
                      className='mt-auto'
                      disabled={userForm.processing}
                    >
                      {userForm.processing ? 'Inscription...' : 'Rejoindre'}
                    </Button>
                  </div>
                </form>

                {/* Artist Lead Form */}
                <form onSubmit={handleArtistSubmit} className="group relative rounded-2xl p-6 sm:p-8 bg-brand shadow-lg flex flex-col" >
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">Artiste ou Équipe</h3>
                  <p className="text-sm text-center mb-4 text-brand-lightest">Rejoins la communauté d'artistes.</p>

                  {artistSuccess && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm text-center">
                      🎵 Parfait ! Bienvenue dans la communauté d'artistes.
                    </div>
                  )}

                  <div className="space-y-3 flex flex-col h-full">
                    <Input
                      type="text"
                      name="artistName"
                      label="Nom d'artiste / Équipe"
                      placeholder="ex: Don Snoop"
                      value={artistForm.data.artistName}
                      onChange={(e) => artistForm.setData('artistName', e.target.value)}
                      error={fieldErrors?.artistName?.message}
                    />
                    <Input
                      type="text"
                      name="role"
                      label="Role du contact"
                      placeholder="ex: Artiste, Manager, Attaché de presse..."
                      value={artistForm.data.role}
                      onChange={(e) => artistForm.setData('role', e.target.value)}
                      error={fieldErrors?.role?.message}
                    />
                    <Input
                      type="email"
                      name="email"
                      label="Email de contact"
                      placeholder="gel@ayo.gwo"
                      value={artistForm.data.email}
                      onChange={(e) => artistForm.setData('email', e.target.value)}
                      error={fieldErrors?.email?.message}
                      required
                    />
                    <Button
                      type="submit"
                      variant='secondary'
                      disabled={artistForm.processing}
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