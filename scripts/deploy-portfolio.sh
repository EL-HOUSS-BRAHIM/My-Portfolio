#!/usr/bin/env bash
# Run on the shared VPS after the documented one-time gateway integration.
# No migration, DNS change, shared proxy replacement, or global cleanup here.
set -Eeuo pipefail
umask 077
root="${PORTFOLIO_ROOT:-$HOME/portfolio}"
shared="${PORTFOLIO_SHARED_ROOT:-$HOME/budgetify}"
config=${1:?Usage: deploy-portfolio.sh /absolute/path/to/release.env}
[[ "$config" = /* && -f "$config" ]] || exit 2
# Configuration is an operator-owned, mode-600 deployment selector file.
set -a
source "$config"
set +a
[[ "$DEPLOY_ENV" =~ ^(staging|production)$ ]]
[[ "$PORTFOLIO_DOMAIN" =~ ^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$ ]]
[[ "$PORTFOLIO_IMAGE" =~ ^ghcr.io/el-houss-brahim/portfolio(-staging)?:[a-f0-9]{40}$ ]]
[[ "$PORTFOLIO_WORKER_IMAGE" =~ ^ghcr.io/el-houss-brahim/portfolio-worker(-staging)?:[a-f0-9]{40}$ ]]
[[ -r "$PORTFOLIO_SECRETS_FILE" ]]
if [[ "$DEPLOY_ENV" = staging ]]; then [[ "$PORTFOLIO_IMAGE" = *portfolio-staging:* && "$PORTFOLIO_WORKER_IMAGE" = *portfolio-worker-staging:* ]]; else [[ "$PORTFOLIO_IMAGE" = *portfolio:* && "$PORTFOLIO_WORKER_IMAGE" = *portfolio-worker:* ]]; fi
[[ -d "$shared/gateway" ]]
mkdir -p "$root/gateway" "$root/releases"
exec 9>"$shared/deploy.lock"
flock -w 600 9
# Other repositories must preserve these additions or deployment stops safely.
grep -Fq 'import /etc/caddy/portfolio/*.caddy' "$shared/gateway/Caddyfile.gateway" || { echo 'Shared Caddy import is not integrated; see docs/OPERATIONS.md' >&2; exit 1; }
grep -Fq '/etc/caddy/portfolio' "$shared/gateway/compose.yaml" || { echo 'Shared gateway mount is not integrated' >&2; exit 1; }
docker network inspect budgetify-edge >/dev/null
state="$root/releases/$DEPLOY_ENV.current"
old=green
[[ ! -f "$state" ]] || old=$(cat "$state")
[[ "$old" = blue || "$old" = green ]]
slot=blue; [[ "$old" != blue ]] || slot=green
export PORTFOLIO_ALIAS="portfolio-$DEPLOY_ENV-$slot"
project="portfolio-$DEPLOY_ENV-$slot"
compose="$root/compose.yaml"
[[ -f "$compose" ]]
route="$root/gateway/$DEPLOY_ENV.caddy"
previous="$root/releases/$DEPLOY_ENV.previous.caddy"
cp -f "$config" "$root/releases/$DEPLOY_ENV-$slot.env"
# Persist computed alias for reproducible rollback/teardown of this slot only.
printf '\nPORTFOLIO_ALIAS=%s\n' "$PORTFOLIO_ALIAS" >> "$root/releases/$DEPLOY_ENV-$slot.env"
if [[ -f "$route" ]]; then cp "$route" "$previous"; else : > "$previous"; fi
rollback(){
 trap - ERR
 cp "$previous" "$route"
 docker compose -f "$shared/gateway/compose.yaml" exec -T proxy caddy reload --config /etc/caddy/Caddyfile || true
 docker compose --project-name "$project" --env-file "$config" -f "$compose" stop || true
 echo 'Candidate stopped; previous portfolio route restored. Other applications were not changed.' >&2
 exit 1
}
trap rollback ERR
docker compose --project-name "$project" --env-file "$config" -f "$compose" pull
docker compose --project-name "$project" --env-file "$config" -f "$compose" up -d --wait --wait-timeout 150
stage=$(mktemp "$root/gateway/.candidate.XXXXXX")
trap 'rm -f -- "$stage"' EXIT
cat > "$stage" <<ROUTE
$PORTFOLIO_DOMAIN {
 encode zstd gzip
 request_body {
  max_size 6MB
 }
 header Strict-Transport-Security "max-age=31536000"
 reverse_proxy $PORTFOLIO_ALIAS:3000 {
  header_up X-Portfolio-Client-IP {client_ip}
 }
}
ROUTE
cp "$stage" "$route"
docker compose -f "$shared/gateway/compose.yaml" exec -T proxy caddy validate --config /etc/caddy/Caddyfile
docker compose -f "$shared/gateway/compose.yaml" exec -T proxy caddy reload --config /etc/caddy/Caddyfile
curl --config "${PORTFOLIO_CURL_CONFIG:-/dev/null}" --fail --silent --max-time 20 "https://$PORTFOLIO_DOMAIN/api/health/live" >/dev/null
curl --config "${PORTFOLIO_CURL_CONFIG:-/dev/null}" --fail --silent --max-time 20 "https://$PORTFOLIO_DOMAIN/en" >/dev/null
curl --fail --silent --max-time 20 https://afrimed.space/ >/dev/null
curl --fail --silent --max-time 20 https://lyvora.afrimed.space/health >/dev/null
curl --fail --silent --max-time 20 https://lyvora-preview.afrimed.space/health >/dev/null
printf '%s\n' "$slot" > "$state"
# Stop just the previous portfolio slot. Retain its image and selector for rollback.
if [[ -f "$root/releases/$DEPLOY_ENV-$old.env" ]]; then
 docker compose --project-name "portfolio-$DEPLOY_ENV-$old" --env-file "$root/releases/$DEPLOY_ENV-$old.env" -f "$compose" stop
fi
trap - ERR
printf 'Portfolio deployed on %s; shared services verified.\n' "$PORTFOLIO_DOMAIN"
