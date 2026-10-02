import db from '@adonisjs/lucid/services/db'
import string from '@adonisjs/core/helpers/string'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Artist from '#models/artist'
import Category from '#models/category'
import Release from '#models/release'
import type {
  TeamReleaseCreateInput,
  TeamReleaseInput,
  TeamReleaseUpdateInput,
} from '#validators/team_release'

function releaseUrls(raw: unknown): string[] {
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw)
      return releaseUrls(parsed)
    } catch {
      return []
    }
  }
  if (!Array.isArray(raw)) return []
  return raw.filter((value): value is string => typeof value === 'string')
}

export class TeamReleaseInputError extends Error {
  constructor(
    public readonly field:
      | 'title'
      | 'artistId'
      | 'newArtistName'
      | 'categoryIds'
      | 'newCategoryName'
      | 'urls'
      | 'cover'
      | 'coverFile',
    message: string
  ) {
    super(message)
  }
}

export default class TeamReleaseService {
  async create(data: TeamReleaseCreateInput): Promise<Release> {
    const id = await db.transaction(async (trx) => {
      const artistId = await this.artistId(data, trx)
      const categoryIds = await this.categoryIds(data, trx)
      await this.assertNoDuplicate(data, artistId, trx)

      const release = await Release.create(
        {
          title: data.title,
          description: data.description ?? '',
          date: data.date,
          type: data.type,
          cover: data.cover ?? null,
          urls: data.urls,
          artistId,
          isSecret: false,
          isAutomated: false,
          voteCount: 0,
        },
        { client: trx }
      )
      release.useTransaction(trx)
      if (categoryIds.length > 0) {
        await release.related('categories').attach(categoryIds)
      }
      return release.id
    })

    return Release.findOrFail(id)
  }

  async update(id: string, data: TeamReleaseUpdateInput): Promise<Release> {
    await db.transaction(async (trx) => {
      const release = await Release.query({ client: trx }).where('id', id).firstOrFail()
      release.useTransaction(trx)
      const artistId = await this.artistId(data, trx)
      const categoryIds = await this.categoryIds(data, trx)
      await this.assertNoDuplicate(data, artistId, trx, release.id)
      if (data.urls?.length === 0 && releaseUrls(release.urls).length > 0) {
        throw new TeamReleaseInputError(
          'urls',
          "Conserve au moins un lien d'écoute pour cette sortie."
        )
      }

      await release
        .merge({
          title: data.title,
          description: data.description ?? '',
          date: data.date,
          type: data.type,
          ...(data.cover !== undefined ? { cover: data.cover } : {}),
          ...(data.urls !== undefined ? { urls: data.urls } : {}),
          artistId,
          isSecret: false,
        })
        .save()

      await release.related('categories').sync(categoryIds)
    })

    return Release.findOrFail(id)
  }

  private async artistId(data: TeamReleaseInput, trx: TransactionClientContract) {
    const newName = data.newArtistName?.trim()
    if (data.artistId && newName) {
      throw new TeamReleaseInputError('artistId', 'Choisis un artiste ou crée un nouveau profil.')
    }
    if (data.artistId) {
      const artist = await Artist.query({ client: trx }).where('id', data.artistId).first()
      if (!artist) {
        throw new TeamReleaseInputError('artistId', 'Cet artiste est introuvable.')
      }
      return artist.id
    }
    if (!newName) {
      throw new TeamReleaseInputError('artistId', 'Choisis ou crée un artiste.')
    }

    const duplicate = await Artist.query({ client: trx })
      .whereRaw('lower(name) = lower(?)', [newName])
      .first()
    if (duplicate) {
      throw new TeamReleaseInputError(
        'newArtistName',
        'Un artiste porte déjà ce nom. Sélectionne son profil existant.'
      )
    }

    const artist = await Artist.create(
      { name: newName, description: null, isVerified: false, spotifyId: null },
      { client: trx }
    )
    return artist.id
  }

  private async categoryIds(
    data: TeamReleaseInput,
    trx: TransactionClientContract
  ): Promise<string[]> {
    const selectedIds = Array.from(new Set(data.categoryIds ?? []))
    if (selectedIds.length > 0) {
      const existing = await Category.query({ client: trx }).whereIn('id', selectedIds)
      if (existing.length !== selectedIds.length) {
        throw new TeamReleaseInputError(
          'categoryIds',
          'Une catégorie sélectionnée est introuvable.'
        )
      }
    }

    const newName = data.newCategoryName?.trim()
    if (!newName) return selectedIds

    let category = await Category.query({ client: trx })
      .whereRaw('lower(name) = lower(?)', [newName])
      .first()
    if (!category) {
      const slug = string.slug(newName)
      if (!slug) {
        throw new TeamReleaseInputError(
          'newCategoryName',
          'Choisis un nom de catégorie plus précis.'
        )
      }
      const slugMatch = await Category.query({ client: trx }).where('slug', slug).first()
      if (slugMatch) {
        throw new TeamReleaseInputError(
          'newCategoryName',
          `Ce nom ressemble à la catégorie « ${slugMatch.name} ». Sélectionne-la dans la recherche.`
        )
      }
      category = await Category.create({ name: newName, description: '' }, { client: trx })
    }
    const combinedIds = Array.from(new Set([...selectedIds, category.id]))
    if (combinedIds.length > 12) {
      throw new TeamReleaseInputError(
        'newCategoryName',
        'Choisis au maximum 12 catégories, nouvelle catégorie comprise.'
      )
    }
    return combinedIds
  }

  private async assertNoDuplicate(
    data: TeamReleaseInput,
    artistId: string,
    trx: TransactionClientContract,
    exceptReleaseId?: string
  ) {
    const normalizedTitle = data.title.trim().replace(/\s+/g, ' ').toLowerCase()
    const date = data.date.toISODate()
    if (!date) {
      throw new TeamReleaseInputError('title', 'La date de sortie est invalide.')
    }
    const query = Release.query({ client: trx })
      .where('artistId', artistId)
      .whereRaw("lower(regexp_replace(btrim(title), '[[:space:]]+', ' ', 'g')) = ?", [
        normalizedTitle,
      ])
      .whereRaw('date::date = ?', [date])
    if (exceptReleaseId) query.whereNot('id', exceptReleaseId)
    if (await query.first()) {
      throw new TeamReleaseInputError(
        'title',
        'Cette sortie existe déjà pour cet artiste et cette date. Corrige sa fiche existante.'
      )
    }
  }
}
