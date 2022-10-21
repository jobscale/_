#!/usr/bin/env bash
set  -eu

{
  days=$(( 365 * 3 + 1 ))
  country=JP
  state=Osaka
  locality=Osaka
  organizational=jsx.jp
  unit=Developpers
  common=jsx.jp
  fname=$(echo $common | sed -e 's/\*\.//g')
  subj="/C=$country/ST=$state/L=$locality/O=$organizational/CN=$common"
}

caPrivate() {
  openssl genrsa -out ca.key 4096
}

caCertificateCreate() {
  openssl req -new -x509 -days $days \
  -subj $subj -key ca.key \
  -out ca.crt
}

serverPrivate() {
  openssl genrsa -out $fname.key 4096
}

serverCertificateRequest() {
  openssl req -new \
  -subj $subj -key $fname.key \
  -out $fname.csr
}

serverCertificateCreate() {
  openssl x509 -req -in $fname.csr \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out $fname.crt -days $days
}

{
  caPrivate
  caCertificateCreate
  serverPrivate
  serverCertificateRequest
  serverCertificateCreate

  ls -lh *{key,crt}
}

