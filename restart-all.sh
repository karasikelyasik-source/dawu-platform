#!/bin/bash

cd /root/dawu-platform
docker-compose up -d

sleep 8

docker exec dawu-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"

cd /root/dawu-platform/apps/api
npm run build
pm2 delete dawu-api || true
pm2 start dist/src/main.js --name dawu-api

cd /root/dawu-platform/apps/web
npm run build
rm -rf .next/standalone/.next/static
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static

pm2 delete dawu-web || true
PORT=3001 pm2 start /root/dawu-platform/apps/web/.next/standalone/server.js --name dawu-web --cwd /root/dawu-platform/apps/web/.next/standalone --update-env

pm2 save
