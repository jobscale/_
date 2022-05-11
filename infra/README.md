# git.io/ramen link to stable

## examples

```bash
# stable
curl -Ls git.io/ramen | sudo bash

# docker
curl -Ls git.io/susi | sudo bash

# graphical
curl -Ls git.io/yakiniku | sudo bash
```

## user data

```bash
#!/usr/bin/env bash
curl -sL git.io/user-data | bash
```

## shorten

```bash
# curl -i https://git.io/ -F "url=https://raw.githubusercontent.com/jobscale/_/master/infra/stable" -F "code=ramen"
# curl -i https://git.io/ -F "url=https://raw.githubusercontent.com/jobscale/_/master/infra/docker" -F "code=susi"
# curl -i https://git.io/ -F "url=https://raw.githubusercontent.com/jobscale/_/master/infra/graphical" -F "code=yakiniku"
# curl -i https://git.io/ -F "url=https://raw.githubusercontent.com/jobscale/_/master/infra/user-data" -F "code=user-data"
# curl -i https://git.io/ -F "url=https://raw.githubusercontent.com/jobscale/_/master/infra/user-add" -F "code=user-add"
# curl -i https://git.io/ -F "url=https://raw.githubusercontent.com/jobscale/_/master/infra/upto-bullseye" -F "code=upto-bullseye"
# curl -i https://git.io/ -F "url=https://raw.githubusercontent.com/jobscale/_/master/infra/ja-jp" -F "code=ja-jp"
# curl -i https://git.io/ -F "url=https://raw.githubusercontent.com/jobscale/_/master/infra/auth-gen" -F "code=auth-gen"
# curl -i https://git.io/ -F "url=https://raw.githubusercontent.com/jobscale/_/master/infra/aws-ec2" -F "code=aws-ec2"
```
