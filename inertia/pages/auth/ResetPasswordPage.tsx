import { Link, useForm } from '@inertiajs/react'
import { ArrowRight } from 'lucide-react'
import type { ResetPasswordPageProps } from '#contracts/auth'
import AuthLayout, { authHref } from '~/layouts/AuthLayout'
import AuthField, { AuthFormError, focusAuthError } from '~/components/auth/AuthField'

export default function ResetPasswordPage({ token, returnTo, valid }: ResetPasswordPageProps) {
  const form = useForm({ token, password: '', password_confirmation: '', returnTo })
  return (
    <AuthLayout
      title={valid ? 'Nouveau mot de passe' : 'Ce lien a expiré'}
      description={
        valid
          ? 'Choisis un nouveau mot de passe pour retrouver ton compte.'
          : 'Ce lien est invalide, a déjà été utilisé ou n’est plus valable. Tu peux en demander un nouveau.'
      }
      returnTo={returnTo}
      footer={
        <Link href={authHref('/login', returnTo)}>
          Revenir à la connexion <ArrowRight size={15} aria-hidden="true" />
        </Link>
      }
    >
      {valid ? (
        <form
          className="sc-auth-form"
          aria-busy={form.processing}
          onSubmit={(event) => {
            event.preventDefault()
            form.post('/reset-password', {
              onError: (errors) => {
                form.reset('password', 'password_confirmation')
                focusAuthError(errors)
              },
            })
          }}
        >
          <AuthFormError errors={form.errors} />
          {form.errors.token && (
            <p className="sc-auth-error sc-auth-form-error" role="alert">
              {form.errors.token}{' '}
              <Link href={authHref('/forgot-password', returnTo)}>Demander un nouveau lien</Link>
            </p>
          )}
          <AuthField
            id="password"
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
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
            required
            maxLength={128}
            value={form.data.password_confirmation}
            onChange={(event) => form.setData('password_confirmation', event.target.value)}
            error={form.errors.password_confirmation}
          />
          <button type="submit" className="sc-button sc-auth-submit" disabled={form.processing}>
            {form.processing ? 'Modification en cours…' : 'Enregistrer le mot de passe'}{' '}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          <p className="sc-auth-hint">Tu devras te reconnecter sur tes autres appareils.</p>
        </form>
      ) : (
        <Link className="sc-button sc-auth-submit" href={authHref('/forgot-password', returnTo)}>
          Recevoir un nouveau lien <ArrowRight size={18} aria-hidden="true" />
        </Link>
      )}
    </AuthLayout>
  )
}
