#!/bin/sh
set -eu

# Each role must finish migrations before serving requests or consuming jobs.
# Lucid's ledger makes subsequent starts a no-op; its lock serializes attempts.
if [ "${RUN_MIGRATIONS_ONCE:-false}" = "true" ]; then
  migration_pid=
  stop_status=
  stop_migration() {
    trap '' TERM INT
    if [ -z "$migration_pid" ]; then
      stop_status=$1
      return
    fi
    kill -TERM "$migration_pid" 2>/dev/null || true
    wait "$migration_pid" || true
    exit "$1"
  }
  trap 'stop_migration 143' TERM
  trap 'stop_migration 130' INT
  QUEUE_ENABLED=false DB_MIGRATION_SINGLE_CONNECTION=true \
    node ace.js migration:run --force &
  migration_pid=$!
  if [ -n "$stop_status" ]; then
    stop_migration "$stop_status"
  fi
  wait "$migration_pid"
  trap - TERM INT
fi

if [ "${APP_ROLE:-web}" = "worker" ]; then
  exec node bin/console.js queue:listen
fi
exec node bin/server.js
