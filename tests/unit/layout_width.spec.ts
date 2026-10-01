import { test } from '@japa/runner'
import { readFile } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'

test('the page shell uses available width instead of including the desktop scrollbar', async ({
  assert,
}) => {
  const layout = await readFile(app.makePath('resources/views/inertia_layout.edge'), 'utf8')
  const bodyClasses = layout.match(/<body\s+class="([^"]+)"/)?.[1].split(/\s+/) ?? []

  assert.include(bodyClasses, 'w-full')
  assert.notInclude(bodyClasses, 'w-screen')
})
