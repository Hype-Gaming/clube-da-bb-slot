#!/usr/bin/env bash
#
# Prepara a estrutura de deploy na VPS. Roda UMA vez, como o usuário de deploy.
# Assume que Node 22+, PM2 e Nginx já estão instalados.
#
#   curl -fsSL <raw-url>/deploy/bootstrap-vps.sh | DEPLOY_PATH=/var/www/clube-slots bash
#   ou:  DEPLOY_PATH=/var/www/clube-slots bash deploy/bootstrap-vps.sh
#
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/clube-slots}"

echo "==> Criando estrutura em $DEPLOY_PATH"
mkdir -p "$DEPLOY_PATH"/{releases,shared,logs}

ENV_FILE="$DEPLOY_PATH/shared/.env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'ENV'
# Runtime do Nuxt (lidos pelo ecosystem.config.cjs e injetados no PM2).
NUXT_PUBLIC_API_BASE=https://routes-eb.grupoautoma.com
NUXT_PUBLIC_APP_NAME=Clube Slots
NUXT_PUBLIC_SIGNUP_URL=
NUXT_PUBLIC_DEPOSIT_URL=

# Porta interna: só o Nginx fala com o Node.
HOST=127.0.0.1
PORT=3000

# Ajuste conforme os cores da VPS ('max' não é suportado aqui, use um número).
PM2_INSTANCES=2
PM2_MAX_MEMORY=400M
ENV
  echo "    criado $ENV_FILE — revise os valores antes do primeiro deploy"
else
  echo "    $ENV_FILE já existe, mantido"
fi
chmod 600 "$ENV_FILE"

echo
echo "==> Estrutura pronta:"
find "$DEPLOY_PATH" -maxdepth 1 -mindepth 1 | sort

cat <<INFO

Próximos passos:

1. Autorize a chave pública do deploy:
     cat >> ~/.ssh/authorized_keys   # cole a pública do par gerado para o GitHub

2. Garanta que o PM2 sobe no boot (uma vez, como root ou com sudo):
     pm2 startup
     # rode o comando que ele imprimir, depois:
     pm2 save

3. Instale o vhost do Nginx:
     sudo cp deploy/nginx-clube-slots.conf /etc/nginx/sites-available/clube-slots
     sudo ln -s /etc/nginx/sites-available/clube-slots /etc/nginx/sites-enabled/
     sudo nginx -t && sudo systemctl reload nginx
     sudo certbot --nginx -d seu-dominio.com.br

4. Configure os secrets no GitHub e dê push na main.

INFO
