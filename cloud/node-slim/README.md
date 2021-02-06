# kubectl port-forward container

## publish k3s

### create kubernetes cluster
```
k3d cluster create --no-lb
```

### build container
```
docker build . -t local/node-slim
```

### create container
```
docker run --name node-slim --restart=always -v $HOME/.kube/config:/root/.kube/config -p 80:80 -p 443:443 -d local/node-slim
```
