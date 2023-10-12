# Shoten URL Installer

## examples

```bash
# stable
curl -Ls jsx.jp/s/stable | sudo bash

# docker
curl -Ls jsx.jp/s/docker | sudo bash

# graphical
curl -Ls jsx.jp/s/graphical | sudo bash
```

## install before

```
apt update && apt install -y vim curl git
```

## shorten

```bash
# stable = curl -sL jsx.jp/s/stable
# docker = curl -sL jsx.jp/s/docker
# graphical = curl -sL jsx.jp/s/graphical
# user-data = curl -sL jsx.jp/s/user-data
# user-add = curl -sL jsx.jp/s/user-add
# ja-jp = curl -sL jsx.jp/s/ja-jp
# auth-gen = curl -sL jsx.jp/s/auth-gen
# aws-ec2 = curl -sL jsx.jp/s/aws-ec2
```

## EC2 user data

```bash
#!/usr/bin/env bash
curl -sL jsx.jp/s/user-data | bash
```
