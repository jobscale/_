#!/usr/bin/env bash
set -eu

clean() {
  kubectl delete secret -n credentials regcred --ignore-not-found
  kubectl delete namespace credentials --ignore-not-found
}

create() {
  FILE=$HOME/.docker/config.json
  kubectl create namespace credentials
  kubectl create secret -n credentials generic regcred --from-file=.dockerconfigjson=$FILE --type=kubernetes.io/dockerconfigjson
}

main() {
  clean
  create
}

main
