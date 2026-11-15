import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Artist from '#models/artist'
import ArtistTerritory from '#models/artist_territory'
import type { TeamArtistTerritoriesInput } from '#validators/team_artist_territories'

export class TerritoryInputError extends Error {
  constructor(
    public readonly field: string,
    message: string
  ) {
    super(message)
  }
}

export async function saveArtistTerritories(
  artistId: string,
  verifierId: string,
  input: TeamArtistTerritoriesInput
): Promise<void> {
  if (!input.reviewConfirmed) {
    throw new TerritoryInputError('reviewConfirmed', 'Confirme ta vérification avant de publier.')
  }
  const seen = new Set<string>()
  input.territories.forEach((territory, index) => {
    if (seen.has(territory.territoryCode)) {
      throw new TerritoryInputError(
        `territories.${index}.territoryCode`,
        'Ce territoire figure déjà dans la sélection.'
      )
    }
    seen.add(territory.territoryCode)
    if (territory.sourceKind === 'public_source' && !territory.sourceReference) {
      throw new TerritoryInputError(
        `territories.${index}.sourceReference`,
        'Ajoute le lien public qui établit cette affiliation.'
      )
    }
    if (territory.sourceReference) {
      const url = new URL(territory.sourceReference)
      if (url.username || url.password) {
        throw new TerritoryInputError(
          `territories.${index}.sourceReference`,
          'Utilise un lien sans identifiant ni mot de passe.'
        )
      }
    }
  })

  await db.transaction(async (trx) => {
    // Serializes team edits for the same artist, including an empty selection.
    await Artist.query({ client: trx }).where('id', artistId).forUpdate().firstOrFail()
    const existing = await ArtistTerritory.query({ client: trx }).where('artist_id', artistId)
    const byCode = new Map(existing.map((entry) => [entry.territoryCode, entry]))

    for (const entry of existing) {
      if (!seen.has(entry.territoryCode)) await entry.useTransaction(trx).delete()
    }

    for (const territory of input.territories) {
      const reference = territory.sourceReference ?? null
      const current = byCode.get(territory.territoryCode)
      if (current) {
        if (
          current.sourceKind !== territory.sourceKind ||
          current.sourceReference !== reference ||
          current.sourceNote !== territory.sourceNote
        ) {
          await current
            .useTransaction(trx)
            .merge({
              sourceKind: territory.sourceKind,
              sourceReference: reference,
              sourceNote: territory.sourceNote,
              verifiedByUserId: verifierId,
              verifiedAt: DateTime.utc(),
            })
            .save()
        }
      } else {
        await ArtistTerritory.create(
          {
            artistId,
            territoryCode: territory.territoryCode,
            sourceKind: territory.sourceKind,
            sourceReference: reference,
            sourceNote: territory.sourceNote,
            verifiedByUserId: verifierId,
            verifiedAt: DateTime.utc(),
          },
          { client: trx }
        )
      }
    }
  })
}
