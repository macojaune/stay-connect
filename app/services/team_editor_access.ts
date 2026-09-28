import env from '#start/env'

/** Native sign-up does not verify email ownership, so access is bound to user IDs. */
export function canManageCatalog(userId: string | null | undefined): boolean {
  if (!userId) return false
  return (env.get('STAYCONNECT_EDITOR_USER_IDS') ?? '')
    .split(',')
    .some((allowedId) => allowedId.trim() === userId)
}
