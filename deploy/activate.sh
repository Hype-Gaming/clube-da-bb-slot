#!/usr/bin/env bash
#
# Ativa uma release já enviada por rsync: troca o symlink `current`, recarrega o PM2,
# valida com health check e reverte automaticamente se o app não responder.
#
# Executado via `ssh host "DEPLOY_PATH=... RELEASE=... bash -s" < deploy/activate.sh`
#
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:?DEPLOY_PATH não definido}"
RELEASE="${RELEASE:?RELEASE não definido}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3020/api/health}"
HEALTH_RETRIES="${HEALTH_RETRIES:-15}"
EXPECTED_HEALTH_RESPONSE="clube-slots:ok"

RELEASE_DIR="$DEPLOY_PATH/releases/$RELEASE"
ECOSYSTEM="$DEPLOY_PATH/ecosystem.config.cjs"

log() { printf '\n\033[1;36m==>\033[0m %s\n' "$*"; }

# --- Sanidade antes de mexer no que está no ar -------------------------------
[ -f "$RELEASE_DIR/.output/server/index.mjs" ] \
  || { echo "ERRO: release incompleta, falta .output/server/index.mjs em $RELEASE_DIR"; exit 1; }
[ -f "$RELEASE_DIR/ecosystem.config.cjs" ] \
  || { echo "ERRO: ecosystem.config.cjs ausente em $RELEASE_DIR"; exit 1; }
[ -f "$DEPLOY_PATH/shared/.env" ] \
  || echo "AVISO: $DEPLOY_PATH/shared/.env não existe — subindo só com os defaults."

mkdir -p "$DEPLOY_PATH/logs"

PREVIOUS="$(readlink -f "$DEPLOY_PATH/current" 2>/dev/null || true)"

activate() {
  local target="$1"
  cp "$target/ecosystem.config.cjs" "$ECOSYSTEM"
  # Symlink temporário + mv -T = troca atômica, sem janela com `current` inexistente.
  ln -sfn "$target" "$DEPLOY_PATH/current.tmp"
  mv -Tf "$DEPLOY_PATH/current.tmp" "$DEPLOY_PATH/current"
  pm2 startOrReload "$ECOSYSTEM" --update-env
}

log "Ativando release $RELEASE"
activate "$RELEASE_DIR"

# --- Health check ------------------------------------------------------------
log "Health check em $HEALTH_URL"
healthy=0
for attempt in $(seq 1 "$HEALTH_RETRIES"); do
  response="$(curl -fsS --max-time 5 "$HEALTH_URL" 2>/dev/null || true)"
  if [ "$response" = "$EXPECTED_HEALTH_RESPONSE" ]; then
    healthy=1
    echo "OK na tentativa $attempt"
    break
  fi
  echo "Tentativa $attempt: resposta inválida ou serviço indisponível."
  sleep 2
done

if [ "$healthy" -ne 1 ]; then
  echo "ERRO: app não respondeu após $HEALTH_RETRIES tentativas."
  if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ] && [ "$PREVIOUS" != "$RELEASE_DIR" ]; then
    log "Revertendo para $(basename "$PREVIOUS")"
    activate "$PREVIOUS"
  else
    echo "Sem release anterior para reverter. Verifique: pm2 logs"
  fi
  pm2 logs --nostream --lines 40 || true
  exit 1
fi

pm2 save --force

# --- Limpeza: mantém as N releases mais recentes -----------------------------
log "Mantendo as $KEEP_RELEASES releases mais recentes"
cd "$DEPLOY_PATH/releases"
ls -1dt -- */ 2>/dev/null | tail -n "+$((KEEP_RELEASES + 1))" | while read -r old; do
  # Nunca remover a release ativa nem a de rollback.
  old_path="$(readlink -f "$old")"
  if [ "$old_path" = "$RELEASE_DIR" ] || [ "$old_path" = "$PREVIOUS" ]; then continue; fi
  echo "removendo $old"
  rm -rf -- "$old"
done

log "Deploy concluído: $RELEASE"
