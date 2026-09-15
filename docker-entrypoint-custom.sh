#!/bin/sh
set -e

DNS_RESOLVER=$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)

case "$DNS_RESOLVER" in
  *:*)
    DNS_RESOLVER="[$DNS_RESOLVER]"
    ;;
esac

export DNS_RESOLVER

GOOGLE_CLIENT_ID_VALUE="${FRONTEND_GOOGLE_CLIENT_ID:-${GOOGLE_CLIENT_ID:-}}"
GOOGLE_CLIENT_ID_VALUE=$(printf '%s' "$GOOGLE_CLIENT_ID_VALUE" | sed 's/[\"\\]/\\&/g')

cat > /usr/share/nginx/html/assets/runtime-config.js <<EOF
window.SPROOCHEN_GOOGLE_CLIENT_ID = "$GOOGLE_CLIENT_ID_VALUE";
EOF

exec /docker-entrypoint.sh nginx -g 'daemon off;'
