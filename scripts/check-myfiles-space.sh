#!/usr/bin/env bash
# Check MyFile space usage
set -e
cd /var/www/liobiz
set -a
source .env.local
set +a
curl -s "${FILESIR_API_BASE}/user/space-usage" \
  -H "Authorization: Bearer ${FILESIR_ACCESS_TOKEN}" \
  -H "Accept: application/json"
