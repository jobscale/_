# Ingress - Multiple Web Site

## https://jsx.jp

Kubernetes v1.25.0

stern version 1.11.0

kind v0.11.1

### install docker

```
iDocker() {
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  sudo add-apt-repository "deb https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
  sudo apt install -y docker-ce apt-transport-https
  sudo usermod -aG docker $(whoami)
} && iDocker
```

### install kubectl

```
iKubectl() {
  setArch() {
    Uname=$(uname)
    UNAME=${Uname,,}
    ARCH=$(uname -m)
    [[ "$ARCH" == x86_64 ]] && ARCH=amd64
  }
  setArch

  FNAME=kubectl
  curl -fsSLO https://storage.googleapis.com/kubernetes-release/release/$(
    curl -fsSL https://storage.googleapis.com/kubernetes-release/release/stable.txt
  )/bin/${UNAME}/${ARCH}/$FNAME
  chmod ugo+x $FNAME
  sudo mv $FNAME /usr/local/bin/kubectl
  [[ "$(grep ' kubernetes' /etc/hosts)" == "" ]] && echo '127.0.0.1 kubernetes' | sudo tee -a /etc/hosts || echo "already hosts"
  kubectl version
} && iKubectl
```

### install stern
```
iStern() {
  setArch() {
    Uname=$(uname)
    UNAME=${Uname,,}
    ARCH=$(uname -m)
    [[ "$ARCH" == x86_64 ]] && ARCH=amd64
  }
  setArch

  FNAME=stern_${UNAME}_${ARCH}
  curl -fsSLO https://github.com/wercker/stern/releases/download/$(
    git ls-remote --refs --tags https://github.com/wercker/stern.git | sort -t '/' -k 3 -V | tail -1 | awk -F/ '{print $3}'
  )/$FNAME
  chmod ugo+x $FNAME
  sudo mv $FNAME /usr/local/bin/stern
  stern --version
} && iStern
```

### install kind

```
iKind() {
  setArch() {
    Uname=$(uname)
    UNAME=${Uname,,}
    ARCH=$(uname -m)
    [[ "$ARCH" == x86_64 ]] && ARCH=amd64
  }
  setArch

  FNAME=kind-${UNAME}-${ARCH}
  curl -fsSLO https://github.com/kubernetes-sigs/kind/releases/download/$(
    git ls-remote --refs --tags https://github.com/kubernetes-sigs/kind.git | grep -v alpha | sort -t '/' -k 3 -V | tail -1 | awk -F/ '{print $3}'
  )/$FNAME
  chmod ugo+x $FNAME
  sudo mv $FNAME /usr/local/bin/kind
  kind version
} && iKind
```

### install npm with nodejs

```
iNodejs() {
  curl -fsSLo- https://raw.githubusercontent.com/creationix/nvm/$(
    git ls-remote --refs --tags https://github.com/nvm-sh/nvm.git | sort -t '/' -k 3 -V | tail -1 | awk -F/ '{print $3}'
  )/install.sh | bash
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
  LATEST=$(nvm ls-remote | grep 'Latest LTS' | tail -1 | awk '{print $1}')
  nvm install $LATEST
  nvm alias default $LATEST
  nvm use $LATEST
  node --version
  npm --version
  id
} && iNodejs
```

### create cluster

```
kind create cluster --name multinode --config multinode.yaml
cp $HOME/.kube/config $HOME/.kube/multinode-config
kubectl get nodes -w
kubectl get pods -A -w
```

### kubectl config

```
kubectl create namespace standard
kubectl config set-context $(kubectl config current-context) --namespace standard
kubectl apply -f limitrange-limits.yaml
```

### setup metalLB system

```
METAL_VERSION=$(git ls-remote --refs --tags https://github.com/danderson/metallb.git | sort -t '/' -k 3 -V | tail -1 | awk -F/ '{print $3}')
kubectl apply -f https://raw.githubusercontent.com/google/metallb/${METAL_VERSION}/manifests/metallb.yaml
kubectl apply -f https://git.io/km-config.yaml
```

### deployment Dashboard

```
DASHBOARD_VERSION=$(git ls-remote --refs --tags https://github.com/kubernetes/dashboard.git | sort -t '/' -k 3 -V | tail -1 | awk -F/ '{print $3}')
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/${DASHBOARD_VERSION}/aio/deploy/recommended.yaml
kubectl apply -f admin-user-service-account.yaml
kubectl describe secrets -n kubernetes-dashboard admin-user | grep ^token
```

### kubectl proxy with Dashboard

```
kubectl proxy &
[[ -s "$(which xdg-open)" ]] && alias open='xdg-open'
open http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

### run deployment

```
kubectl create deployment nginx --image nginx
kubectl expose deployment nginx --name nginx --type LoadBalancer --port=443,80
kubectl get deployment,pods,svc
```

### ingress nginx

```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/static/mandatory.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/static/provider/cloud-generic.yaml
```

### kubectl port-forward

```
sudo -E kubectl port-forward -n ingress-nginx --address 0.0.0.0 svc/ingress-nginx 443:443 80:80
```

### manual address LoadBalancer
```
svc() {
  [[ $(nc -v localhost 8001 -w 1 < /dev/null 2>&1 | grep succeeded | wc -l) != 1 ]] && kubectl proxy &
  KUBE_NAMESPACE=$1
  KUBE_SERVICE=$1
  KUBE_HOST=http://127.0.0.1:8001
  KUBE_TOKEN=$(kubectl describe secrets | grep ^token | awk '{print $2}')
  kubectl config view --raw
  echo "token $KUBE_TOKEN"
  # open ${KUBE_HOST}/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy
  kubectl -n $KUBE_NAMESPACE -ojson get service $KUBE_SERVICE > ../loadbalancer.json
  vi ../loadbalancer.json
  https_proxy= http_proxy= curl -k --header "Authorization: Bearer $KUBE_TOKEN" ${KUBE_HOST}/api/v1/namespaces/${KUBE_NAMESPACE}/services/${KUBE_SERVICE}/status -X PUT -d @../loadbalancer.json -H 'content-type:application/json'
}
```

### tls termination

```
kubectl create secret tls wildcard-tls --cert sslGen/wildcard.jsx.jp.cert --key sslGen/wildcard.jsx.jp.key
echo 'apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: wildcard-tls
spec:
  backend:
    serviceName: nginx
    servicePort: 80' > ingress.yaml
kubectl apply -f ingress.yaml
```

### rollout deployment

```
kubectl rollout restart deployment nginx
kubectl get pods --watch
kubectl rollout status deployment nginx
kubectl rollout history deployment nginx
kubectl rollout history deployment nginx --revision 3
```

### rollback deployment

```
kubectl rollout undo deployment web --to-revision 2
kubectl get pods --watch
```

### install develop tools
```
iDevelop() {
  sudo apt update
  sudo apt install -y iproute2 dnsutils netcat whois curl vim tmux git
} && iDevelop
```
