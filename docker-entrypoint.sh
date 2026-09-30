#!/bin/sh
set -e

echo "=========================================="
echo "  PhotoPlus - Iniciando en Producción"
echo "=========================================="

if [ -n "$DATABASE_URL" ]; then
  echo "==> Verificando y aplicando tablas en PostgreSQL (Prisma db push)..."
  npx prisma db push --skip-generate || echo "Advertencia: No se pudo ejecutar prisma db push en este intento, continuando..."
fi

echo "==> Iniciando servidor web Next.js..."
exec node server.js
