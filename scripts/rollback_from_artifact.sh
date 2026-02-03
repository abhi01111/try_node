#!/bin/bash
set -e

# ---------- LOGGING ----------
LOG_DIR="/opt/docker-images/logs"
LOG_FILE="$LOG_DIR/rollback.log"
mkdir -p "$LOG_DIR"
exec >> "$LOG_FILE" 2>&1

echo "========================================"
echo "Rollback started at $(date)"
echo "Host: $(hostname)"

# ---------- EXPECTED ENV ----------
: "${MONGO_USER:?Missing MONGO_USER}"
: "${MONGO_PASS:?Missing MONGO_PASS}"
: "${MONGO_DB:?Missing MONGO_DB}"

ARTIFACT_DIR="/opt/docker-images"
cd "$ARTIFACT_DIR"

echo "Stopping existing containers"
docker rm -f frontend backend mongodb || true

echo "Loading rollback images from artifacts"
docker load -i frontend_*.tar
docker load -i backend_*.tar

echo "Starting MongoDB (rollback)"
docker run -d --name mongodb \
  --network app_net \
  -v mongo_data:/data/db \
  -v mongo_logs:/var/log/mongodb \
  -e MONGO_INITDB_ROOT_USERNAME="$MONGO_USER" \
  -e MONGO_INITDB_ROOT_PASSWORD="$MONGO_PASS" \
  -e MONGO_INITDB_DATABASE="$MONGO_DB" \
  mongo:7 \
  --logpath /var/log/mongodb/mongod.log --logappend

echo "Starting backend (rollback)"
docker run -d --name backend \
  -p 5003:5003 \
  --network app_net \
  -v backend_logs:/app/logs \
  -e MONGO_HOST=mongodb \
  -e MONGO_PORT=27017 \
  -e MONGO_USER="$MONGO_USER" \
  -e MONGO_PASS="$MONGO_PASS" \
  -e MONGO_DB="$MONGO_DB" \
  backend

echo "Starting frontend (rollback)"
docker run -d --name frontend \
  -p 80:80 \
  --network app_net \
  -v frontend_access_logs:/var/log/nginx/access \
  -v frontend_error_logs:/var/log/nginx/error \
  frontend

echo "Rollback completed successfully at $(date)"
