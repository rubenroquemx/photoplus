#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ] && [ -f "./node_modules/prisma/build/index.js" ]; then
  echo "==> Verificando y sincronizando tablas en PostgreSQL con Prisma..."
  node ./node_modules/prisma/build/index.js db push --skip-generate || echo "Aviso: Se continuó sin db push inmediato."
fi

echo "==> Iniciando PhotoPlus en producción..."
exec node server.js
