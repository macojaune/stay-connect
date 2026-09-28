const leaderboardDirtyKey = 'stayconnect:leaderboard-dirty'

export function markLeaderboardDirty(): void {
  try {
    sessionStorage.setItem(leaderboardDirtyKey, '1')
  } catch {
    // Storage can be unavailable in private browsing; the next full visit still gets fresh data.
  }
}

export function isLeaderboardDirty(): boolean {
  try {
    return sessionStorage.getItem(leaderboardDirtyKey) === '1'
  } catch {
    return false
  }
}

export function clearLeaderboardDirty(): void {
  try {
    sessionStorage.removeItem(leaderboardDirtyKey)
  } catch {
    // The next full visit still gets fresh data when storage is unavailable.
  }
}
