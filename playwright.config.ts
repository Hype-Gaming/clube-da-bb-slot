import process from 'node:process'
import { defineConfig } from '@playwright/test'

// Em CI usamos o Chromium do próprio Playwright. No Windows, onde normalmente não há
// download do browser, caímos no Edge instalado (ou no que PLAYWRIGHT_EDGE_PATH apontar).
const windowsEdge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const executablePath = process.env.PLAYWRIGHT_EDGE_PATH
  || (!process.env.CI && process.platform === 'win32' ? windowsEdge : undefined)

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  reporter: 'list',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4180',
    browserName: 'chromium',
    serviceWorkers: 'block',
    ...(executablePath ? { launchOptions: { executablePath } } : {})
  },
  webServer: {
    command: 'node .output/server/index.mjs',
    url: 'http://127.0.0.1:4173',
    env: { HOST: '127.0.0.1', PORT: '4173' },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
})
