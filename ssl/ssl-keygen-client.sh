#!/bin/bash -eu

country=JA
state=Osaka
locality=Osaka
organizational=jsx.jp
unit=Developpers
common=jsx.jp

rsa() {
  openssl genrsa \
    -out client.key 4096
  openssl req \
    -new \
    -subj "/C=$country/ST=$state/L=$locality/O=$organizational/CN=$common" \
    -key client.key \
    -out client.csr
  openssl x509 \
    -req \
    -days 365 \
    -in client.csr \
    -CA $common.cert \
    -CAkey $common.key \
    -set_serial 01 \
    -out client.crt
}

rsa

