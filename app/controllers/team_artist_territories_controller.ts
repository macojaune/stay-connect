import type { HttpContext } from '@adonisjs/core/http'
import Artist from '#models/artist'
import {
  canManageCatalog,
  renderCatalogForbidden,
  renderCatalogNotFound,
} from '#services/team_editor_access'
import { renderPage } from '#services/inertia_page'
import {
  saveArtistTerritories,
  TerritoryInputError,
} from '#services/team_artist_territories_service'
import { teamArtistTerritoriesValidator } from '#validators/team_artist_territories'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default class TeamArtistTerritoriesController {
  async edit(ctx: HttpContext) {
    if (!this.authorized(ctx)) return renderCatalogForbidden(ctx)
    if (!UUID.test(ctx.params.id)) return renderCatalogNotFound(ctx)
    ctx.response.header('Cache-Control', 'no-store')
    ctx.response.header('X-Robots-Tag', 'noindex, nofollow')
    const artist = await Artist.query()
      .where('id', ctx.params.id)
      .preload('territories', (query) => query.orderBy('territory_code'))
      .firstOrFail()
    const success: unknown = ctx.session.flashMessages.get('success')
    return renderPage(
      ctx,
      'team/artists/territories',
      {
        artist: {
          id: artist.id,
          name: artist.name,
          territories: artist.territories.map((affiliation) => ({
            territoryCode: affiliation.territoryCode,
            sourceKind: affiliation.sourceKind,
            sourceReference: affiliation.sourceReference,
            sourceNote: affiliation.sourceNote,
            verifiedAt: affiliation.verifiedAt.toISO(),
          })),
        },
        success: typeof success === 'string' ? success : null,
      },
      `Affiliations de ${artist.name}`
    )
  }

  async update(ctx: HttpContext) {
    if (!this.authorized(ctx)) return renderCatalogForbidden(ctx)
    if (!UUID.test(ctx.params.id)) return renderCatalogNotFound(ctx)
    const input = await ctx.request.validateUsing(teamArtistTerritoriesValidator)
    try {
      await saveArtistTerritories(ctx.params.id, ctx.auth.use('web').getUserOrFail().id, input)
    } catch (error: unknown) {
      if (!(error instanceof TerritoryInputError)) throw error
      ctx.session.flashErrors({ [error.field]: error.message })
      return ctx.response.redirect().toPath(`/equipe/artistes/${ctx.params.id}/territoires`)
    }
    ctx.session.flash('success', 'Affiliations enregistrées. Les badges sont maintenant publics.')
    return ctx.response.redirect().toPath(`/equipe/artistes/${ctx.params.id}/territoires`)
  }

  private authorized(ctx: HttpContext): boolean {
    return canManageCatalog(ctx.auth.use('web').getUserOrFail().id)
  }
}
