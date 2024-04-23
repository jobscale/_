# Shorten URL Installer

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
sudo apt update && sudo apt install -y curl
```

## shorten

```bash
# stable = curl -sL jsx.jp/s/stable
# docker = curl -sL jsx.jp/s/docker
# graphical = curl -sL jsx.jp/s/graphical
# cinnamon = curl -sL jsx.jp/s/cinnamon
# kde = curl -sL jsx.jp/s/kde
# chrome = curl -sL jsx.jp/s/chrome
# code = curl -sL jsx.jp/s/code
# nodejs = curl -sL jsx.jp/s/nodejs
# user-data = curl -sL jsx.jp/s/user-data
# user-add = curl -sL jsx.jp/s/user-add
# ja-jp = curl -sL jsx.jp/s/ja-jp
# auth-gen = curl -sL jsx.jp/s/auth-gen
# aws-ec2 = curl -sL jsx.jp/s/aws-ec2
```

## EC2 auto scaling

```bash
#!/usr/bin/env bash
curl -sL jsx.jp/s/auto-scaling | ENV=dev bash
```

## EC2 user data

```bash
#!/usr/bin/env bash
curl -sL jsx.jp/s/user-data | bash
```
