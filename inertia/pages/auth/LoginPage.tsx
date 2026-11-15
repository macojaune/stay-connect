import { Link, useForm } from '@inertiajs/react'
import { ArrowRight, Check } from 'lucide-react'
import type { LoginPageProps } from '#contracts/auth'
import AuthLayout, { authHref } from '~/layouts/AuthLayout'
import AuthField, { AuthFormError, focusAuthError } from '~/components/auth/AuthField'

export default function LoginPage({ returnTo, status }: LoginPageProps) {
  const form = useForm({ email: '', password: '', returnTo })
  return (
    <AuthLayout
      title="Connexion"
      description="Retrouve tes découvertes et les sorties que tu soutiens."
      returnTo={returnTo}
      footer={
        <p>
          Pas encore de compte ?{' '}
          <Link href={authHref('/register', returnTo)}>
            Créer mon compte <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </p>
      }
    >
      {status === 'password-reset' && (
        <p className="sc-auth-notice" role="status">
          <Check size={20} aria-hidden="true" />
          Ton mot de passe a été modifié. Tu peux te connecter.
        </p>
      )}
      <form
        className="sc-auth-form"
        aria-busy={form.processing}
        onSubmit={(event) => {
          event.preventDefault()
          form.post('/login', {
            onError: (errors) => {
              form.reset('password')
              focusAuthError(errors)
            },
          })
        }}
      >
        <AuthFormError errors={form.errors} />
        <AuthField
          id="email"
          label="Adresse email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          value={form.data.email}
          onChange={(event) => form.setData('email', event.target.value)}
          error={form.errors.email}
          placeholder="toi@exemple.com"
        />
        <AuthField
          id="password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          required
          value={form.data.password}
          onChange={(event) => form.setData('password', event.target.value)}
          error={form.errors.password}
        />
        <Link href={authHref('/forgot-password', returnTo)} className="sc-auth-forgot">
          Mot de passe oublié ?
        </Link>
        <button type="submit" className="sc-button sc-auth-submit" disabled={form.processing}>
          {form.processing ? 'Connexion en cours…' : 'Se connecter'}{' '}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        {returnTo.startsWith('/sorties/') && (
          <p className="sc-auth-hint">Tu retrouveras cette sortie après connexion.</p>
        )}
      </form>
    </AuthLayout>
  )
}
