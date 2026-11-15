import { test } from '@japa/runner'
import { readFile, readdir } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'

test('public site sources do not reintroduce the rejected geographic wording', async ({
  assert,
}) => {
  const matches: string[] = []
  for (const directory of ['inertia', 'resources/views', 'app', 'public']) {
    const base = app.makePath(directory)
    for (const file of await readdir(base, { recursive: true })) {
      if (!/\.(?:tsx?|edge|html|json)$/.test(file)) continue
      const content = await readFile(app.makePath(directory, file), 'utf8')
      if (/diaspor/i.test(content)) matches.push(directory + '/' + file)
    }
  }
  assert.deepEqual(matches, [])
})

test('both shared footers keep the signature above their navigation and brand content', async ({
  assert,
}) => {
  const editorial = await readFile(app.makePath('inertia/layouts/EditorialLayout.tsx'), 'utf8')
  const legacy = await readFile(app.makePath('inertia/components/Footer.tsx'), 'utf8')
  const signature = await readFile(app.makePath('inertia/components/SiteSignature.tsx'), 'utf8')

  assert.include(signature, 'Développé entre deux écoutes par')
  assert.include(signature, 'MarvinL.com')
  for (const [source, contentMarker] of [
    [editorial, 'sc-footer-top'],
    [legacy, 'grid grid-cols-1'],
  ]) {
    assert.include(source, '<SiteSignature />')
    assert.isBelow(source.indexOf('<SiteSignature />'), source.indexOf(contentMarker))
    assert.equal(source.split('<SiteSignature />').length - 1, 1)
  }
})
