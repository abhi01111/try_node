#!/bin/bash
# ---------- CONFIG ----------
LOG_DIR="/opt/docker-images/logs"
LOG_FILE="$LOG_DIR/rollback.log"

mkdir -p "$LOG_DIR"
# create Log directory to does not fail rollback dur to no directory problem

# ---------- LOGGING ----------
exec >> "$LOG_FILE" 2>&1
# exec changes current shells output streams
# >> “$LOG_FILE” redirects he standard output
# 2>&1redirects standard error

echo "=================================================="
echo "Rollback started at $(date)"
echo "Hostname: $(hostname)"

# ---------- INPUT ----------
CURRENT_TAG="$1"

if [ -z "$CURRENT_TAG" ]; then
  echo "ERROR: CURRENT_TAG not provided"
  exit 1
fi

PREVIOUS_TAG=$((CURRENT_TAG - 1))

echo "Current tag : $CURRENT_TAG"
echo "Previous tag: $PREVIOUS_TAG"

if [ "$PREVIOUS_TAG" -le 0 ]; then
  echo "No previous version available, rollback skipped"
  exit 0
fi

# ---------- VERIFY IMAGES ----------
echo "Checking images..."

docker image inspect frontend:$PREVIOUS_TAG >/dev/null 2>&1 || {
  echo "ERROR: frontend:$PREVIOUS_TAG not found"
  exit 1
}

docker image inspect backend:$PREVIOUS_TAG >/dev/null 2>&1 || {
  echo "ERROR: backend:$PREVIOUS_TAG not found"
  exit 1
}

# ---------- STOP FAILED CONTAINERS ----------
echo "Stopping failed containers..."
docker rm -f frontend backend || true

# ---------- START BACKEND ----------
echo "Starting backend rollback container..."
docker run -d \
  --name backend \
  -p 5003:5003 \
  --network app_net \
  -e MONGO_HOST=mongodb \
  -e MONGO_PORT=27017 \
  -e MONGO_USER="$MONGO_USER" \
  -e MONGO_PASS="$MONGO_PASS" \
  -e MONGO_DB="$MONGO_DB" \
  backend:$PREVIOUS_TAG

# ---------- START FRONTEND ----------
echo "Starting frontend rollback container..."
docker run -d \
  --name frontend \
  -p 80:80 \
  --network app_net \
  frontend:$PREVIOUS_TAG

echo "Rollback completed successfully at $(date)"
exit 0
