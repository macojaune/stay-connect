import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string
  label: string
  hint?: string
  error?: string
}

export function focusAuthError(errors: Record<string, string>) {
  const field = Object.keys(errors)
    .map((name) => document.getElementById(name))
    .find(Boolean)
  field?.focus()
}

export function AuthFormError({ errors }: { errors: Record<string, string | undefined> }) {
  return errors.form ? (
    <p className="sc-auth-error sc-auth-form-error" role="alert">
      {errors.form}
    </p>
  ) : null
}

export default function AuthField({ id, label, hint, error, type = 'text', ...input }: Props) {
  const [visible, setVisible] = useState(false)
  const password = type === 'password'
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ')
  return (
    <div className="sc-auth-field">
      <label htmlFor={id}>{label}</label>
      <div className={password ? 'sc-auth-input sc-auth-input-password' : 'sc-auth-input'}>
        <input
          {...input}
          id={id}
          name={input.name ?? id}
          type={password && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
        {password && (
          <button
            type="button"
            className="sc-auth-reveal"
            onClick={() => setVisible(!visible)}
            aria-label={`${visible ? 'Masquer' : 'Afficher'} le mot de passe${id === 'password_confirmation' ? ' de confirmation' : ''}`}
            aria-pressed={visible}
            aria-controls={id}
          >
            {visible ? (
              <EyeOff size={20} aria-hidden="true" />
            ) : (
              <Eye size={20} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="sc-auth-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="sc-auth-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
