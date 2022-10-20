#!/usr/bin/env bash
set  -eu

{
  days=1826
  country=JA
  state=Osaka
  locality=Osaka
  organizational=jsx.jp
  unit=Developpers
  common=jsx.jp
  fname=$(echo $common | sed -e 's/\*\.//g')
  subj="/C=$country/ST=$state/L=$locality/O=$organizational/CN=$common"
}

rsa() {
  openssl req -new -newkey rsa:4096 \
  -days $days -nodes -x509 -subj $subj \
  -keyout $fname.key \
  -out $fname.crt
}

ec() {
  openssl req -new -newkey ec
  -pkeyopt ec_paramgen_curve:prime256v1 \
  -days $days -nodes -x509 -subj $subj \
  -keyout $fname.key \
  -out $fname.crt
}

rsa
ls -lh *{key,crt}
