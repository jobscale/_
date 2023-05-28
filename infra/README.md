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

## install before

```
apt update && apt install -y vim curl
```

## user data

```bash
#!/usr/bin/env bash
# Deprecated git.io
curl -sL git.io/user-data | bash
```

```bash
#!/usr/bin/env bash
curl -sL jsx.jp/s/user-data | bash
```

## shorten

```bash
# stable = curl -sL git.io/ramen
# docker = curl -sL git.io/susi
# graphical = curl -sL git.io/yakiniku
# user-data = curl -sL git.io/user-data
# user-add = curl -sL git.io/user-add
# upto-bullseye = curl -sL git.io/upto-bullseye
# ja-jp = curl -sL git.io/ja-jp
# auth-gen = curl -sL git.io/auth-gen
# aws-ec2 = curl -sL git.io/aws-ec2
```
