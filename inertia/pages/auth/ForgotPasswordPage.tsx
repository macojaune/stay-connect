import { Link, useForm } from '@inertiajs/react'
import { ArrowRight, Mail } from 'lucide-react'
import type { ForgotPasswordPageProps } from '#contracts/auth'
import AuthLayout, { authHref } from '~/layouts/AuthLayout'
import AuthField, { AuthFormError, focusAuthError } from '~/components/auth/AuthField'

export default function ForgotPasswordPage({ returnTo, status }: ForgotPasswordPageProps) {
  const form = useForm({ email: '', returnTo })
  return (
    <AuthLayout
      title={status === 'sent' ? 'Regarde tes emails' : 'Mot de passe oublié ?'}
      description={
        status === 'sent'
          ? 'Si un compte correspond à cette adresse, tu recevras un lien pour choisir un nouveau mot de passe.'
          : 'Indique l’email de ton compte pour recevoir un lien de récupération.'
      }
      returnTo={returnTo}
      footer={
        <p>
          Tu l’as retrouvé ?{' '}
          <Link href={authHref('/login', returnTo)}>
            Se connecter <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </p>
      }
    >
      {status === 'sent' ? (
        <div className="sc-auth-sent" role="status">
          <Mail size={30} aria-hidden="true" />
          <p>Le lien est valable 30 minutes. Pense à vérifier tes courriers indésirables.</p>
          <Link href={authHref('/forgot-password', returnTo)}>Utiliser une autre adresse</Link>
        </div>
      ) : (
        <form
          className="sc-auth-form"
          aria-busy={form.processing}
          onSubmit={(event) => {
            event.preventDefault()
            form.post('/forgot-password', { onError: focusAuthError })
          }}
        >
          <AuthFormError errors={form.errors} />
          <AuthField
            id="email"
            label="Adresse email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={form.data.email}
            onChange={(event) => form.setData('email', event.target.value)}
            error={form.errors.email}
            placeholder="toi@exemple.com"
          />
          <button type="submit" className="sc-button sc-auth-submit" disabled={form.processing}>
            {form.processing ? 'Demande en cours…' : 'Recevoir le lien'}{' '}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
