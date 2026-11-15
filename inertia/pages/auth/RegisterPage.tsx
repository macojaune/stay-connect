import { Link, useForm } from '@inertiajs/react'
import { ArrowRight } from 'lucide-react'
import type { RegisterPageProps } from '#contracts/auth'
import AuthLayout, { authHref } from '~/layouts/AuthLayout'
import AuthField, { AuthFormError, focusAuthError } from '~/components/auth/AuthField'

export default function RegisterPage({ returnTo }: RegisterPageProps) {
  const form = useForm({ name: '', email: '', password: '', password_confirmation: '', returnTo })
  return (
    <AuthLayout
      title="Créer ton compte"
      description="Garde tes pull-ups à portée de main, partage tes avis et propose des artistes à découvrir."
      returnTo={returnTo}
      footer={
        <p>
          Déjà membre ?{' '}
          <Link href={authHref('/login', returnTo)}>
            Se connecter <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </p>
      }
    >
      <form
        className="sc-auth-form"
        aria-busy={form.processing}
        onSubmit={(event) => {
          event.preventDefault()
          form.post('/register', {
            onError: (errors) => {
              form.reset('password', 'password_confirmation')
              focusAuthError(errors)
            },
          })
        }}
      >
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
          hint="C’est le nom affiché avec tes commentaires."
        />
        <AuthField
          id="email"
          label="Adresse email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          value={form.data.email}
          onChange={(event) => form.setData('email', event.target.value)}
          error={form.errors.email}
          placeholder="toi@exemple.com"
        />
        <AuthField
          id="password"
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          value={form.data.password}
          onChange={(event) => form.setData('password', event.target.value)}
          error={form.errors.password}
          hint="8 caractères minimum. Une phrase fonctionne aussi."
        />
        <AuthField
          id="password_confirmation"
          label="Confirme ton mot de passe"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          required
          value={form.data.password_confirmation}
          onChange={(event) => form.setData('password_confirmation', event.target.value)}
          error={form.errors.password_confirmation}
        />
        <button type="submit" className="sc-button sc-auth-submit" disabled={form.processing}>
          {form.processing ? 'Création en cours…' : 'Créer mon compte'}{' '}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <p className="sc-auth-hint">
          Ton email reste privé. L’inscription au récap hebdomadaire se fait séparément.
        </p>
      </form>
    </AuthLayout>
  )
}
