#!/bin/sh
set -e

DNS_RESOLVER=$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)

case "$DNS_RESOLVER" in
  *:*)
    DNS_RESOLVER="[$DNS_RESOLVER]"
    ;;
esac

export DNS_RESOLVER

exec /docker-entrypoint.sh nginx -g 'daemon off;'