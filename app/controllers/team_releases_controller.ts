import type { HttpContext } from '@adonisjs/core/http'
import Artist from '#models/artist'
import Category from '#models/category'
import Release from '#models/release'
import TeamReleaseService, { TeamReleaseInputError } from '#services/team_release_service'
import CoverStorage from '#services/cover_storage'
import { canManageCatalog } from '#services/team_editor_access'
import { renderPage } from '#services/inertia_page'
import {
  createTeamReleaseValidator,
  updateTeamReleaseValidator,
  type TeamReleaseCreateInput,
  type TeamReleaseUpdateInput,
} from '#validators/team_release'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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
  const values: unknown[] = raw
  return values.filter((value): value is string => typeof value === 'string')
}

export default class TeamReleasesController {
  private readonly releases = new TeamReleaseService()

  async create(ctx: HttpContext) {
    if (!this.authorized(ctx)) return ctx.response.forbidden()
    this.privatePage(ctx)
    return this.form(ctx, null)
  }

  async edit(ctx: HttpContext) {
    if (!this.authorized(ctx)) return ctx.response.forbidden()
    this.privatePage(ctx)
    if (!UUID_REGEX.test(ctx.params.id)) return ctx.response.notFound()
    const release = await Release.query()
      .where('id', ctx.params.id)
      .preload('categories')
      .firstOrFail()
    return this.form(ctx, release)
  }

  async store(ctx: HttpContext) {
    if (!this.authorized(ctx)) return ctx.response.forbidden()
    const payload = await ctx.request.validateUsing(createTeamReleaseValidator)
    try {
      const release = await this.withCover(payload, (input) => this.releases.create(input))
      return ctx.response.redirect().toPath(`/sorties/${release.slug}`)
    } catch (error: unknown) {
      if (!(error instanceof TeamReleaseInputError)) throw error
      ctx.session.flashErrors({ [error.field]: error.message })
      return ctx.response.redirect().toPath('/equipe/sorties/nouvelle')
    }
  }

  async update(ctx: HttpContext) {
    if (!this.authorized(ctx)) return ctx.response.forbidden()
    if (!UUID_REGEX.test(ctx.params.id)) return ctx.response.notFound()
    const payload = await ctx.request.validateUsing(updateTeamReleaseValidator)
    try {
      const release = await this.withCover(payload, (input) =>
        this.releases.update(ctx.params.id, input)
      )
      return ctx.response.redirect().toPath(`/sorties/${release.slug}`)
    } catch (error: unknown) {
      if (!(error instanceof TeamReleaseInputError)) throw error
      ctx.session.flashErrors({ [error.field]: error.message })
      return ctx.response.redirect().toPath(`/equipe/sorties/${ctx.params.id}/modifier`)
    }
  }

  private async form(ctx: HttpContext, release: Release | null) {
    const [artists, categories] = await Promise.all([
      Artist.query().select('id', 'name').orderBy('name'),
      Category.query().select('id', 'name').orderBy('name'),
    ])
    return renderPage(
      ctx,
      'team/releases/form',
      {
        mode: release ? ('edit' as const) : ('create' as const),
        artists: artists.map(({ id, name }) => ({ id, name })),
        categories: categories.map(({ id, name }) => ({ id, name })),
        release: release
          ? {
              id: release.id,
              title: release.title,
              description: release.description,
              date: release.date.toISODate() ?? '',
              type: release.type,
              cover: release.cover,
              urls: releaseUrls(release.urls),
              artistId: release.artistId,
              categoryIds: release.categories.map(({ id }) => id),
            }
          : null,
      },
      release ? `Modifier ${release.title}` : 'Ajouter une sortie'
    )
  }

  private authorized(ctx: HttpContext) {
    return canManageCatalog(ctx.auth.use('web').getUserOrFail().id)
  }

  private async withCover<T extends TeamReleaseCreateInput | TeamReleaseUpdateInput>(
    payload: T,
    persist: (input: T) => Promise<Release>
  ): Promise<Release> {
    if (payload.coverFile && payload.cover !== undefined)
      throw new TeamReleaseInputError(
        'coverFile',
        'Choisis une URL ou un fichier pour la pochette.'
      )
    const uploaded = payload.coverFile ? await CoverStorage.save(payload.coverFile) : null
    try {
      return await persist({ ...payload, ...(uploaded ? { cover: uploaded.url } : {}) })
    } catch (error: unknown) {
      if (uploaded) await CoverStorage.remove(uploaded.name)
      throw error
    }
  }

  private privatePage(ctx: HttpContext) {
    ctx.response.header('Cache-Control', 'no-store')
    ctx.response.header('X-Robots-Tag', 'noindex, nofollow')
  }
}
