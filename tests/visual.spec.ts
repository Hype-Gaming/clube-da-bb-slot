import { expect, test } from '@playwright/test'

const session = JSON.stringify({
  token: 'visual-test-token',
  cookieKey: 'visual-test-cookie',
  user: { name: 'Visitante' },
  balance: 125.5
})

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
}

test('login responsivo', async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 360, height: 800 }]) {
    const page = await browser.newPage({ viewport })
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: 'Entre para jogar' })).toBeVisible()
    await assertNoHorizontalOverflow(page)
    await page.screenshot({ path: `test-results/login-${viewport.width}.png`, fullPage: true })
    await page.close()
  }
})

test('login usa o contrato /api/auth/login', async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined
  await page.route('**/api/auth/login', async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': 'http://127.0.0.1:4180',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type, x-brand-slug, x-base-domain'
        }
      })
      return
    }
    requestBody = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': 'http://127.0.0.1:4180' },
      body: JSON.stringify({
        access_token: 'test-token',
        cookie_key: 'test-cookie',
        user: { name: 'Teste' },
        balance: 10
      })
    })
  })
  await page.goto('/auth/login')
  await page.getByLabel('E-mail ou CPF').fill('teste@example.com')
  await page.locator('#password').fill('senha-segura')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/')
  expect(requestBody).toMatchObject({
    email: 'teste@example.com',
    brand_slug: 'esportiva',
    base_domain: 'bet.br',
    app_source: 'web',
    save_cookies: true
  })
})

test('catálogo responsivo e busca', async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 360, height: 800 }]) {
    const page = await browser.newPage({ viewport })
    await page.addInitScript(value => localStorage.setItem('esportiva-slots_auth', value), session)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Todos os jogos' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Fortune Mouse' })).toBeVisible()
    await assertNoHorizontalOverflow(page)
    await page.getByRole('searchbox', { name: 'Buscar jogo' }).fill('inexistente')
    await expect(page.getByText('Nenhum jogo encontrado')).toBeVisible()
    await page.getByRole('searchbox', { name: 'Buscar jogo' }).fill('')
    await page.screenshot({ path: `test-results/catalog-${viewport.width}.png`, fullPage: true })
    await page.close()
  }
})

test('player em iframe e rota desconhecida sem fallback', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.addInitScript(value => localStorage.setItem('esportiva-slots_auth', value), session)
  await page.route('**/api/start-game**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ game_url: 'data:text/html,<title>Slot test</title><body style="background:%23120d08;color:white">Jogo carregado</body>' })
  }))
  await page.goto('/slot/fortune-tiger')
  await expect(page.locator('iframe[allow="autoplay; fullscreen"]')).toBeVisible()
  await assertNoHorizontalOverflow(page)
  await page.screenshot({ path: 'test-results/player-mobile.png', fullPage: true })

  await page.goto('/slot/nao-existe')
  await expect(page.getByRole('heading', { name: 'Jogo não encontrado' })).toBeVisible()
  await expect(page.locator('iframe')).toHaveCount(0)
})
