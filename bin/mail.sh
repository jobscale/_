#!/usr/bin/env bash
set -eu

SUBJECT_BASE64=$(echo -n "🍺 ごきげんよう 🍻" | openssl enc -e -base64)
SUBJECT=""
for s in $SUBJECT_BASE64
do
  SUBJECT="${SUBJECT} =?UTF-8?B?${s}?="
done

HEAD="From: info@jsx.jp
To: jobscalespam@gmail.com
Cc: info@jsx.jp,jobscalespam@na-cat.com
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: Base64
Subject: ${SUBJECT}"

eval "$(cat /etc/os-release)"
GID=$(curl -s https://inet-ip.info/ip)
HOST=$(hostname)

BODY="$(echo -n "Hi, this is my message, and I'm sending it to you!
⛄ こんにちは ☃

Host: ${HOST}
Arch: $(arch)
Distribution: ${NAME} ${VERSION}
Timestamp: $(date)
GlobalIP: ${GID}

$(df -h /)
$(free -h)" | base64)"

echo -n "$HEAD

$BODY" | sendmail -t
