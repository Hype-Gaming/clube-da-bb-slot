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
NUXT_PUBLIC_DEPOSIT_URL=

# Porta interna: só o Nginx fala com o Node.
HOST=127.0.0.1
PORT=3020

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

1. Autorize a chave pública do CI:
     nano /root/.ssh/authorized_keys   # cole a pública do par gerado para o GitHub
     chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys

2. Garanta que o PM2 sobe no boot:
     pm2 startup systemd
     # o pm2 save vem depois do primeiro deploy

3. Instale o vhost do Nginx:
     cp deploy/nginx-clube-slots.conf /etc/nginx/sites-available/slotpremiado
     ln -s /etc/nginx/sites-available/slotpremiado /etc/nginx/sites-enabled/
     nginx -t && systemctl reload nginx
     certbot --nginx -d slotpremiado.com -d www.slotpremiado.com

4. Configure os secrets no GitHub e dê push na main.
   Ver TUTORIAL-VPS.md para o passo a passo completo.

INFO
