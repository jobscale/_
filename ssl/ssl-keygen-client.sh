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

caPrivate() {
  openssl genrsa \
  -out ca.key 4096
}

clientCertificateRequest() {
  openssl req -new \
  -subj $subj -key ca.key \
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
  caPrivate
  clientCertificateRequest
  clientCertificateCreate
}

ls -lh *{key,crt}
