#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/kasa/kasa-licence-portal}"
ENV_FILE="$APP_DIR/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  cp "$APP_DIR/.env.example" "$ENV_FILE"
  echo "Created $ENV_FILE"
  echo "Edit it with production secrets and DATABASE_URL, then run this command again."
  exit 1
fi

cd "$APP_DIR"

npm ci
npm run db:generate
npm run db:push
npm run build

pm2 startOrReload ecosystem.config.cjs --env production
pm2 save

echo ""
echo "Kasa Licence Portal is running with PM2."
echo "Check status:"
echo "  pm2 status kasa-licence-portal"
echo ""
echo "Watch logs:"
echo "  pm2 logs kasa-licence-portal"
