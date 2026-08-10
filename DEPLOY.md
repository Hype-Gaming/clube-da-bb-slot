# Deploy — Clube Slots

Pipeline: **GitHub Actions builda → rsync do `.output` → PM2 reload na VPS**, com
health check e rollback automático. A VPS nunca compila nada e não precisa das
devDependencies — o `.output` do Nitro é autocontido.

```
push na main
   └─ GitHub Actions
        ├─ npm ci
        ├─ npm run build      (inclui typecheck via vue-tsc)
        ├─ playwright e2e     ← gate: falhou, não sobe
        ├─ rsync .output + ecosystem.config.cjs → VPS:releases/<sha>/
        └─ ssh → deploy/activate.sh
              ├─ symlink current → releases/<sha>   (troca atômica)
              ├─ pm2 startOrReload --update-env     (cluster, zero-downtime)
              ├─ health check                        ← falhou, reverte sozinho
              └─ remove releases antigas (mantém 5)
```

## Layout na VPS

```
/var/www/clube-slots/
├── ecosystem.config.cjs     copiado da release ativa
├── current -> releases/<sha>
├── releases/<sha>/.output/
├── shared/.env              variáveis de ambiente, fora do git
└── logs/
```

## Setup inicial

### 1. VPS

```bash
ssh usuario@vps
DEPLOY_PATH=/var/www/clube-slots bash deploy/bootstrap-vps.sh
nano /var/www/clube-slots/shared/.env      # revise os valores
```

PM2 no boot:

```bash
pm2 startup      # rode o comando que ele imprimir
pm2 save
```

Nginx:

```bash
sudo cp deploy/nginx-clube-slots.conf /etc/nginx/sites-available/clube-slots
sudo ln -s /etc/nginx/sites-available/clube-slots /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d seu-dominio.com.br
```

### 2. Chave SSH de deploy

Gere um par **dedicado ao CI** (sem passphrase) — não reaproveite sua chave pessoal:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/clube_slots_deploy -C "github-actions" -N ""
ssh-copy-id -i ~/.ssh/clube_slots_deploy.pub usuario@vps
```

Fingerprint do host, para não depender de TOFU no CI:

```bash
ssh-keyscan -p 22 -H seu-dominio.com.br
```

### 3. Secrets no GitHub

`Settings → Secrets and variables → Actions`

| Secret | Exemplo | Obrigatório |
|---|---|---|
| `SSH_HOST` | `203.0.113.10` | sim |
| `SSH_USER` | `deploy` | sim |
| `SSH_PORT` | `22` | não (default `22`) |
| `SSH_PRIVATE_KEY` | conteúdo de `~/.ssh/clube_slots_deploy` | sim |
| `SSH_KNOWN_HOSTS` | saída do `ssh-keyscan` | recomendado |
| `DEPLOY_PATH` | `/var/www/clube-slots` | sim |

Variáveis opcionais (aba *Variables*):

| Variável | Efeito |
|---|---|
| `HEALTH_URL` | URL do health check. Default `http://127.0.0.1:3000/` |
| `SKIP_E2E` | `true` pula o gate de testes. **Temporário** — ver abaixo |

> ⚠️ Hoje 2 dos 3 testes E2E falham (falhas pré-existentes, ver "Pendências").
> Enquanto não forem corrigidos, o deploy fica vermelho. Para destravar,
> defina `SKIP_E2E=true` e remova a variável depois de consertar a suíte.

O workflow usa `environment: production` — se quiser aprovação manual antes de
cada deploy, crie esse environment com *required reviewers*.

## Variáveis de ambiente

Ficam **só** em `shared/.env` na VPS. Como o Nuxt lê `runtimeConfig.public` em
tempo de execução, mudar uma variável não exige rebuild:

```bash
nano /var/www/clube-slots/shared/.env
pm2 reload /var/www/clube-slots/ecosystem.config.cjs --update-env
```

## Operação

```bash
pm2 status
pm2 logs clube-slots
pm2 monit
pm2 reload clube-slots            # zero-downtime
pm2 describe clube-slots
```

### Rollback manual

O `activate.sh` reverte sozinho quando o health check falha. Para voltar a uma
release específica, na VPS:

```bash
cd /var/www/clube-slots
ls -1t releases/                              # escolha o sha

ln -sfn releases/<sha> current.tmp
mv -Tf current.tmp current
cp releases/<sha>/ecosystem.config.cjs ecosystem.config.cjs
pm2 startOrReload ecosystem.config.cjs --update-env
```

Pelo GitHub: `Actions → Deploy VPS → Run workflow` a partir do commit desejado.

## Pendências conhecidas

Falhas **pré-existentes** na suíte E2E (reproduzidas com o `nuxt.config` original,
não vieram do pipeline):

1. `catálogo responsivo e busca` — overflow horizontal: `documentElement.scrollWidth`
   maior que o `clientWidth` em um dos viewports testados (1440 ou 360).
2. `player em iframe` — em `/slot/fortune-tiger` a página renderiza
   *"Jogo indisponível / O jogo solicitado não existe no nosso catálogo"*, ou seja
   `getSlotById` devolve `undefined` no momento da asserção. O `id` existe em
   [app/constants/slots.ts](app/constants/slots.ts), então a suspeita é a interação
   entre o redirect SSR do `auth.global.ts` e a resolução de `route.params.id`.

## Ajuste de capacidade

`PM2_INSTANCES` no `shared/.env` define os workers em cluster. Regra prática:
número de vCPUs, respeitando ~150–250 MB de RSS por worker. Numa VPS de 1 GB e
1 vCPU, use `1`.
