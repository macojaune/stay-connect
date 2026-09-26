import { useForm } from '@inertiajs/react'
import { ArrowRight, Check, Mail } from 'lucide-react'
import type { MemberAccountProps } from '#contracts/member'
import MemberLayout from '~/layouts/MemberLayout'
import AuthField, { AuthFormError, focusAuthError } from '~/components/auth/AuthField'
import '~/css/auth-editorial.css'

export default function AccountPage({ profile, status }: MemberAccountProps) {
  const form = useForm({ name: profile.fullName ?? profile.username })
  const reset = useForm({})
  return (
    <MemberLayout
      title="Ton compte"
      description="Ton nom dans la communauté et tes accès à StayConnect."
    >
      <section className="sc-member-settings-section">
        <div>
          <h2>Ton profil public</h2>
          <p>Le pseudo apparaît avec les commentaires que tu laisses sur les sorties.</p>
        </div>
        <form
          className="sc-auth-form"
          aria-busy={form.processing}
          onSubmit={(event) => {
            event.preventDefault()
            form.patch('/mon-compte', {
              preserveScroll: true,
              onError: focusAuthError,
              onSuccess: () => form.setDefaults(),
            })
          }}
        >
          {status === 'updated' && (
            <p role="status" className="sc-member-notice">
              <Check size={19} aria-hidden="true" />
              Ton pseudo a été mis à jour.
            </p>
          )}
          <AuthFormError errors={form.errors} />
          <AuthField
            id="name"
            label="Ton pseudo"
            autoComplete="nickname"
            minLength={2}
            maxLength={50}
            required
            value={form.data.name}
            onChange={(event) => form.setData('name', event.target.value)}
            error={form.errors.name}
          />
          <button className="sc-button" type="submit" disabled={form.processing || !form.isDirty}>
            {form.processing ? 'Enregistrement…' : 'Enregistrer le pseudo'}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </form>
      </section>
      <section className="sc-member-settings-section">
        <div>
          <h2>Connexion et sécurité</h2>
          <p>
            Ton email sert à te connecter et à récupérer ton compte. Il n’est pas affiché
            publiquement.
          </p>
        </div>
        <div className="sc-member-security">
          <dl>
            <dt>Adresse de connexion</dt>
            <dd>{profile.email}</dd>
          </dl>
          <form
            className="sc-auth-form"
            aria-busy={reset.processing}
            onSubmit={(event) => {
              event.preventDefault()
              reset.post('/mon-compte/mot-de-passe', { preserveScroll: true })
            }}
          >
            <h3>Changer de mot de passe</h3>
            <p>Reçois un lien sur cette adresse pour choisir un nouveau mot de passe.</p>
            <AuthFormError errors={reset.errors} />
            {status === 'reset-link-sent' && (
              <p role="status" className="sc-member-notice">
                <Check size={19} aria-hidden="true" />
                Le lien a été demandé. Consulte ta boîte mail et tes courriers indésirables.
              </p>
            )}
            <button type="submit" className="sc-button-light" disabled={reset.processing}>
              <Mail size={17} aria-hidden="true" />
              {reset.processing ? 'Demande en cours…' : 'Recevoir le lien'}
            </button>
          </form>
        </div>
      </section>
    </MemberLayout>
  )
}
