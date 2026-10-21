#!/usr/bin/env bash
# Operator-owned task. Requires pg_dump, age, rsync, Node 24 and web dependencies.
# PGPASSFILE supplies the DB password; do not put credentials in command arguments.
set -Eeuo pipefail
umask 077
: "${PGHOST:?}" "${PGDATABASE:?}" "${PGUSER:?}" "${PGPASSFILE:?}"
: "${BACKUP_AGE_RECIPIENT:?}" "${BACKUP_REMOTE:?}"
export PGSSLMODE=verify-full
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
stage=$(mktemp -d)
trap 'rm -rf -- "$stage"' EXIT
pg_dump --format=custom --no-owner --schema=public --schema=auth --schema=storage --file="$stage/database.dump"
(cd "$root/web" && node --env-file="${PORTFOLIO_BACKUP_ENV:?Absolute path to Supabase backup credential env file}" scripts/storage-backup.ts "$stage/storage")
tar -czf "$stage/portfolio.tar.gz" -C "$stage" database.dump storage
name="portfolio-$(date -u +%Y%m%dT%H%M%SZ).tar.gz.age"
age -r "$BACKUP_AGE_RECIPIENT" -o "$stage/$name" "$stage/portfolio.tar.gz"
# Remote SSH host keys must already be pinned by the operator.
rsync --archive --protect-args -- "$stage/$name" "$BACKUP_REMOTE/"
printf 'Encrypted portfolio backup uploaded: %s\n' "$name"
