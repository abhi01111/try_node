#!/bin/bash
set -e

echo "Rollback started..."

REQUIRED_VARS=("LAST_SUCCESS" "MONGO_USER" "MONGO_PASS" "MONGO_DB")

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "Required environment variable $VAR is missing"
    exit 1
  fi
done

echo "Rolling back to last SUCCESSFUL build: $LAST_SUCCESS"

echo "MongoDB note:"
echo "   - MONGO_INITDB_* variables are ONLY used on first-time initialization"
echo "   - Existing mongo_data volume means credentials are reused"
echo "   - This is expected and SAFE during rollback"

echo "Stopping existing containers..."
docker stop frontend backend mongodb 2>/dev/null || true
docker rm frontend backend mongodb 2>/dev/null || true

echo "Starting MongoDB..."
docker run -d \
  --name mongodb \
  --network app_net \
  -v mongo_data:/data/db \
  -v mongo_logs:/var/log/mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=${MONGO_USER} \
  -e MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASS} \
  -e MONGO_INITDB_DATABASE=${MONGO_DB} \
  mongo:7 \
  --logpath /var/log/mongodb/mongod.log --logappend

echo "Starting backend:${LAST_SUCCESS}"
docker run -d \
  --name backend \
  --network app_net \
  -p 5003:5003 \
  -e MONGO_HOST=mongodb \
  -e MONGO_PORT=27017 \
  -e MONGO_USER=${MONGO_USER} \
  -e MONGO_PASS=${MONGO_PASS} \
  -e MONGO_DB=${MONGO_DB} \
  -v backend_logs:/app/logs \
  backend:${LAST_SUCCESS}

echo "Starting frontend:${LAST_SUCCESS}"
docker run -d \
  --name frontend \
  --network app_net \
  -p 80:80 \
  -v frontend_access_logs:/var/log/nginx/access \
  -v frontend_error_logs:/var/log/nginx/error \
  frontend:${LAST_SUCCESS}

echo "Rollback completed successfully to ${LAST_SUCCESS}"
exit 0
