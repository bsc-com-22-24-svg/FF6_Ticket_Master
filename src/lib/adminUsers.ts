const DISABLED_USERS_KEY = 'tm_disabled_user_ids'

export function isUserDisabled(userId: string): boolean {
  try {
    const raw = localStorage.getItem(DISABLED_USERS_KEY)
    const ids: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(ids) && ids.includes(userId)
  } catch {
    return false
  }
}

export function setUserDisabled(userId: string, disabled: boolean): void {
  let ids: string[] = []
  try {
    const raw = localStorage.getItem(DISABLED_USERS_KEY)
    const value: unknown = raw ? JSON.parse(raw) : []
    if (Array.isArray(value)) ids = value.filter((id): id is string => typeof id === 'string')
  } catch {
    ids = []
  }
  const next = new Set(ids)
  if (disabled) next.add(userId)
  else next.delete(userId)
  localStorage.setItem(DISABLED_USERS_KEY, JSON.stringify([...next]))
}
