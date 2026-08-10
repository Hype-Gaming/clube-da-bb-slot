/**
 * PM2 — Clube Slots (Nuxt 4 / Nitro node-server)
 *
 * Este arquivo é copiado para a raiz do deploy na VPS (ex.: /var/www/clube-slots)
 * e sempre aponta para o symlink `current`, que o activate.sh troca a cada release.
 *
 * Layout esperado na VPS:
 *   /var/www/clube-slots/
 *   ├── ecosystem.config.cjs   <- este arquivo
 *   ├── current -> releases/<sha>
 *   ├── releases/<sha>/.output/server/index.mjs
 *   ├── shared/.env            <- variáveis de ambiente (fora do git)
 *   └── logs/
 *
 * Uso:  pm2 startOrReload ecosystem.config.cjs --update-env
 */
const fs = require('node:fs')
const path = require('node:path')

const ROOT = __dirname
const CURRENT = path.join(ROOT, 'current')

/** Lê o shared/.env sem depender do pacote dotenv (o .output não o carrega sozinho). */
function readEnvFile(file) {
  if (!fs.existsSync(file)) return {}
  const parsed = {}
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator === -1) continue
    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    const quoted = (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith('\'') && value.endsWith('\''))
    if (quoted) value = value.slice(1, -1)
    parsed[key] = value
  }
  return parsed
}

const shared = readEnvFile(path.join(ROOT, 'shared', '.env'))

module.exports = {
  apps: [
    {
      name: shared.PM2_APP_NAME || 'clube-slots',
      script: path.join(CURRENT, '.output', 'server', 'index.mjs'),
      cwd: CURRENT,
      // O Nitro é stateless, então cluster escala entre os cores sem sessão pegajosa.
      exec_mode: 'cluster',
      instances: Number(shared.PM2_INSTANCES || 2),
      // Nunca reiniciar por watch em produção; o deploy faz reload explícito.
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '15s',
      // Evita que um vazamento derrube a VPS inteira.
      max_memory_restart: shared.PM2_MAX_MEMORY || '400M',
      kill_timeout: 5000,
      listen_timeout: 10000,
      time: true,
      merge_logs: true,
      out_file: path.join(ROOT, 'logs', 'out.log'),
      error_file: path.join(ROOT, 'logs', 'error.log'),
      env: {
        NODE_ENV: 'production',
        // Só o Nginx fala com o Node; nada exposto direto na internet.
        HOST: '127.0.0.1',
        PORT: '3000',
        // Valores do shared/.env vencem os defaults acima.
        ...shared
      }
    }
  ]
}
