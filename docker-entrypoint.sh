#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "==> Verificando y sincronizando tablas en PostgreSQL..."
  if [ -f "./scripts/init-db.mjs" ]; then
    node ./scripts/init-db.mjs || echo "Aviso: Se continuó sin init-db inmediato."
  fi
fi

echo "==> Iniciando PhotoPlus en producción..."
exec node server.js
