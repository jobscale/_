#!/usr/bin/env bash
# shell dependency GNU bash 5.1.x

LOCK=/tmp/modem_sim.lock
LOG=/var/log/modem_sim.log
ERR=/var/log/modem_sim-error.log

if ! mkdir "$LOCK" 2>/dev/null; then
  echo "$(TZ=GMT-9 date -Iseconds) Already running" >> "$ERR"
  exit 1
fi

cleanup() {
  rmdir "$LOCK"
}
trap cleanup EXIT

care() {
  echo "care of repeater"
  # ip neigh | grep apcli0
  # ip link set apcli0 down && ip link set apcli0 up && date
  # /etc/init.d/repeater restart && date
  # wifi down && wifi up && date
  sleep 90
}

main() {
  local attempt=5

  while (( attempt > 0 )); do
    gateway=$(ip r | awk '/default via .* dev apcli0/ {print $3}')
    gip=$(curl -fsS --connect-timeout 2 --max-time 2 inet-ip.info/ip)
    if [[ -n "$gip" ]]; then
      echo "$(TZ=GMT-9 date -Iseconds) OK GlobalIp $gip"
      return 0
    elif [[ -n "$gateway" ]] && ping -c 1 -W 2 "$gateway" >/dev/null; then
      echo "$(TZ=GMT-9 date -Iseconds) Repeater Healthy"
      return 0
    else
      attempt=$((attempt - 1))
      echo "$(TZ=GMT-9 date -Iseconds) NG retry $attempt"
      if (( attempt > 0 )); then
        sleep 2
      fi
    fi
  done

  echo "$(TZ=GMT-9 date -Iseconds) Network Error" >&2
  care
  return 1
}

main >> "$LOG" 2>> "$ERR"
