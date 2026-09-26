export interface LoginPageProps {
  returnTo: string
  status?: 'password-reset'
}

export interface RegisterPageProps {
  returnTo: string
}

export interface ForgotPasswordPageProps {
  returnTo: string
  status?: 'sent'
}

export interface ResetPasswordPageProps {
  token: string
  returnTo: string
  valid: boolean
}

export interface PasswordResetRequest {
  email: string
  returnTo: string
}
