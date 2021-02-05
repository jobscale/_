# Ingress - Multiple Web Site

## https://jsx.jp

Kubernetes v1.20.2

kind v0.10.0

### install docker

```
iDocker() {
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
  sudo apt install -y docker-ce apt-transport-https
  sudo usermod -aG docker $(whoami)
} && iDocker
$SHELL -l
```

### install kubectl

```
iKubectl() {
  curl -LO https://storage.googleapis.com/kubernetes-release/release/$(
    curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt
  )/bin/linux/amd64/kubectl
  chmod +x kubectl
  sudo mv kubectl /usr/local/bin
} && iKubectl
```

### install stern
```
iStern() {
  curl -sLo stern https://github.com/wercker/stern/releases/download/$(
    git ls-remote --refs --tags https://github.com/wercker/stern.git | sort -t '/' -k 3 -V | tail -1 | awk -F/ '{print $3}'
  )/stern_linux_amd64
  chmod ugo+x stern
  sudo mv stern /usr/local/bin
} && iStern
```

### install kind

```
iKind() {
  curl -sLo kind https://github.com/kubernetes-sigs/kind/releases/download/$(
    git ls-remote --refs --tags https://github.com/kubernetes-sigs/kind.git | sort -t '/' -k 3 -V | tail -1 | awk -F/ '{print $3}'
  )/kind-$(uname)-amd64
  chmod +x kind
  sudo mv kind /usr/local/bin
} && iKind
```

### install npm with nodejs

```
iNodejs() {
  curl -o- https://raw.githubusercontent.com/creationix/nvm/$(
    git ls-remote --refs --tags https://github.com/nvm-sh/nvm.git | sort -t '/' -k 3 -V | tail -1 | awk -F/ '{print $3}'
  )/install.sh | bash
  . ~/.bashrc
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
KINDNAME=staging
kind create cluster --name $KINDNAME --config multinode.yaml
ln -sfn kind-config-$KINDNAME $HOME/.kube/config
kubectl get nodes -w
kubectl get pods -A -w
```

### kubectl config

```
kubectl config current-context
kubectl config set-context $(kubectl config current-context) --namespace default
```

### setup metallb system

```
kubectl apply -f https://raw.githubusercontent.com/google/metallb/${
  git ls-remote --refs --tags https://github.com/danderson/metallb.git | sort -t '/' -k 3 -V | tail -1 | awk -F/ '{print $3}'
}/manifests/metallb.yaml
kubectl apply -f https://git.io/km-config.yaml
```

### deployment Dashboard

```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v1.10.1/src/deploy/recommended/kubernetes-dashboard.yaml
kubectl apply -f admin-user-service-account.yaml
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep admin-user | awk '{print $1}')
```

### kubectl proxy with Dashboard

```
kubectl proxy
xdg-open http://127.0.0.1:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/
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

### kubectl port-forward

```
sudo -E kubectl port-forward -n ingress-nginx --address 0.0.0.0 svc/ingress-nginx 443:443 80:80
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

### install debug tools
```
apt update && apt install -y net-tools dnsutils curl vim tmux git
```
