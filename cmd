#!/bin/bash -eu

tlsGen() {
  unzip -oP $(sed -e 's/"//g' env.json) .tls
}
initialize() {
  [[ "$(nc partner 443 -v -w 1 < /dev/null 2>&1 | grep -e succeeded -e open | wc -l)" == "0" ]] && return $(touch env.json)
  timeout 5 curl -sk -H "Cookie: X-AUTH=X0X0X0X0X0X0X0X" https://partner/env.json | grep -i =A | awk -F'"' '{print $4}' | sed -e 's/=//g' | base64 -d | jq '.jsxjp.access' > env.json &
  wait
  [[ ! -s env.json ]] && return $(touch env.json)
  tlsGen
}
routing() {
  wpip=$(host wordpress | awk '{print $4}')
  sed -i -e "s/http:\/\/wordpress:80/http:\/\/$wpip:80\$request_uri/" /etc/nginx/conf.d/54-wordpress.conf
}
main() {
  [[ ! -f env.json ]] && initialize && routing
  nginx -g 'daemon off;'
}
main
