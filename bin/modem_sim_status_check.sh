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
  # ip link set apcli0 down && ip link set apcli0 up
  # /etc/init.d/repeater restart && date
  # wifi down && wifi up && date
}

main() {
  local attempt=6

  while (( attempt > 0 )); do
    if result=$(curl -fsS --connect-timeout 3 --max-time 3 inet-ip.info/ip) &&
    [[ -n "$result" ]]; then
      echo "$(TZ=GMT-9 date -Iseconds) OK GlobalIp $result"
      return 0
    else
      attempt=$((attempt - 1))
      echo "$(TZ=GMT-9 date -Iseconds) NG retry $attempt"
      if (( attempt > 0 )); then
        sleep 5
      fi
    fi
  done

  echo "$(TZ=GMT-9 date -Iseconds) Network Error" >&2
  care
  return 1
}

main >> "$LOG" 2>> "$ERR"
