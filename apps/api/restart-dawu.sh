#!/bin/bash

cd /root/dawu-platform
docker-compose up -d

sleep 10

docker exec dawu-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"

cd /root/dawu-platform/apps/api

npm run build

pm2 delete dawu-api || true
pm2 start dist/src/main.js --name dawu-api --update-env
pm2 save

curl http://localhost:3000/tables
