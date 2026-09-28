import type Release from '#models/release'
import type { TerritoryCode } from '#contracts/territories'
import { territoryCodes } from '#contracts/territories'

/** Only linked credits contribute; an unlinked Spotify/name credit stays unknown. */
export function releaseTerritories(release: Release): TerritoryCode[] {
  const credited = [release.artist, ...release.features.map((feature) => feature.artist)]
  const verified = new Set(
    credited.flatMap(
      (artist) => artist?.territories.map((affiliation) => affiliation.territoryCode) ?? []
    )
  )
  return territoryCodes.filter((code) => verified.has(code))
}
