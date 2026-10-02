import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import env from '#start/env'
import Release from '#models/release'
import Artist from '#models/artist'
import Feature from '#models/feature'
import User from '#models/user'
import Vote from '#models/vote'
import type { ReleaseShowProps } from '#contracts/release_page'

async function release(isSecret = false, artistId: string | null = null) {
  return Release.create({
    title: 'Page coherence ' + randomUUID(),
    description: '',
    date: DateTime.utc(),
    type: 'single',
    urls: [],
    isSecret,
    isAutomated: false,
    voteCount: 0,
    artistId,
  })
}
async function page(slug: string) {
  const url = 'http://127.0.0.1:' + env.get('PORT') + '/sorties/' + slug
  const initial = await fetch(url)
  const html = await initial.text()
  const encoded = html.match(/data-page="([^"]+)"/)?.[1]
  if (!encoded) throw new Error('Expected initial Inertia HTML')
  const initialPage = JSON.parse(
    encoded
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&amp;', '&')
  ) as { version: string | number }
  const response = await fetch(url, {
    headers: {
      'X-Inertia': 'true',
      'X-Inertia-Version': String(initialPage.version),
      'Accept': 'text/html',
    },
  })
  if (response.status !== 200) throw new Error('Unexpected page status ' + response.status)
  return ((await response.json()) as { props: ReleaseShowProps }).props.release
}

test.group('Public release page coherence', (group) => {
  group.setup(() => {
    if (
      !['127.0.0.1', 'localhost', '::1'].includes(env.get('DB_HOST')) ||
      !/(test|relaunch)/i.test(env.get('DB_DATABASE'))
    )
      throw new Error('Requires isolated local fixtures')
  })
  test('counts all comments and keeps them visible past twelve silent pull-ups', async ({
    assert,
    cleanup,
  }) => {
    const published = await release()
    cleanup(() => published.delete())
    for (let index = 0; index < 25; index++) {
      const id = randomUUID().replaceAll('-', '')
      const user = await User.create({
        fullName: 'Local comment fixture',
        username: 'comment_' + id,
        email: id + '@example.test',
        password: 'LocalCommentFixtureOnly1!',
        authVersion: 0,
      })
      cleanup(() => user.delete())
      const createdAt = DateTime.utc()
        .minus({ days: index < 13 ? 3 : 1 })
        .plus({ minutes: index })
      await Vote.create({
        releaseId: published.id,
        userId: user.id,
        vote: 1,
        comment: index < 13 ? 'Comment ' + index : null,
        createdAt,
        updatedAt: createdAt,
      })
    }
    const shown = await page(published.slug)
    assert.equal(shown.votesSummary.total, 25)
    assert.equal(shown.votesSummary.comments, 13)
    assert.lengthOf(shown.reviews, 12)
    assert.isTrue(shown.reviews.every((review) => review.comment?.startsWith('Comment')))
    assert.isTrue(shown.reviews.some((review) => review.comment === 'Comment 12'))
  }).timeout(30000)

  test('artist card counts match the public catalog, including featured credits once', async ({
    assert,
    cleanup,
  }) => {
    const principal = await Artist.create({ name: 'Principal ' + randomUUID() })
    const featured = await Artist.create({ name: 'Guest ' + randomUUID() })
    cleanup(() => principal.delete())
    cleanup(() => featured.delete())
    const published = await release(false, principal.id)
    const second = await release(false, principal.id)
    const secret = await release(true, principal.id)
    cleanup(() => published.delete())
    cleanup(() => second.delete())
    cleanup(() => secret.delete())
    await Feature.create({
      releaseId: published.id,
      artistId: principal.id,
      artistName: principal.name,
    })
    await Feature.create({
      releaseId: published.id,
      artistId: featured.id,
      artistName: featured.name,
    })
    const shown = await page(published.slug)
    assert.equal(shown.artist?.releaseCount, 2)
    assert.equal(
      shown.featuredArtists.find((artist) => artist.artistId === featured.id)?.releaseCount,
      1
    )
    assert.equal(
      shown.featuredArtists.find((artist) => artist.artistId === principal.id)?.releaseCount,
      2
    )
  })
})
