#!/usr/bin/env bash
set -euo pipefail

SERVER="user@your-vps-ip"
REMOTE_DIR="/var/www/aboutme"

rsync -avz --delete \
  --exclude '.git' \
  --exclude 'deploy' \
  --exclude 'README.md' \
  ./ "$SERVER:$REMOTE_DIR/"

ssh "$SERVER" "sudo chown -R caddy:caddy $REMOTE_DIR"
echo "Deployed to $SERVER:$REMOTE_DIR"
