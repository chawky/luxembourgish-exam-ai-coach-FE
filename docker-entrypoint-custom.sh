#!/bin/sh
set -e

DNS_RESOLVER=$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)

export DNS_RESOLVER

exec /docker-entrypoint.sh nginx -g 'daemon off;'