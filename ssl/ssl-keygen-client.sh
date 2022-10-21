#!/usr/bin/env bash
set  -eu

{
  days=$(( 365 * 3 + 1 ))
  country=JA
  state=Osaka
  locality=Osaka
  organizational=jsx.jp
  unit=Developpers
  common=jsx.jp
  fname=$(echo $common | sed -e 's/\*\.//g')
  subj="/C=$country/ST=$state/L=$locality/O=$organizational/CN=$common"
}

clientPrivate() {
  openssl genrsa -out client.key 4096
}

clientCertificateRequest() {
  openssl req -new \
  -subj $subj -key client.key \
  -out client.csr
}

clientCertificateCreate() {
  openssl x509 -req \
  -days $days -in client.csr \
  -CA $fname.crt -CAkey $fname.key \
  -set_serial 01 \
  -out client.crt
}

{
  clientPrivate
  clientCertificateRequest
  clientCertificateCreate
}

ls -lh *{key,crt}
