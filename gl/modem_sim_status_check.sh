#!/usr/bin/env bash
# shell dependency GNU bash 5.1.x
# scp jobscale@172.16.6.77:_/gl/modem_sim_status_check.sh /usr/bin/modem_sim_status_check.sh
# scp jobscale@172.16.6.77:_/gl/modem_sim_status_monitor /etc/gl_crontabs/crontabs.d/modem_sim_status_monitor

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
  iw dev apcli0 link
  ip n
  ip r
  ip -4 -o a
  echo "$(TZ=GMT-9 date -Iseconds) wifi restart $(wifi restart >/dev/null 2>&1)"
  sleep 60
  echo "$(TZ=GMT-9 date -Iseconds) after n seconds GlobalIp $(curl -fsS --connect-timeout 2 --max-time 2 inet-ip.info/ip)"
  echo "end of care"
}

main() {
  local attempt=20

  while (( attempt > 0 )); do
    start=$(awk '{print $1}' /proc/uptime)
    gateway=$(ip r | awk '/default via .* dev apcli0/ {print $3}')
    gip=$(curl -fsS --connect-timeout 2 --max-time 2 inet-ip.info/ip)
    end=$(awk '{print $1}' /proc/uptime)
    latency=$(awk "BEGIN {print ($end - $start) * 1000}")
    if [[ -n "$gip" ]]; then
      echo "$(TZ=GMT-9 date -Iseconds) OK GlobalIp $gip ($latency ms)"
      return 0
    elif [[ -n "$gateway" ]] && ping -c 1 -W 2 "$gateway" >/dev/null; then
      echo "$(TZ=GMT-9 date -Iseconds) Repeater Healthy"
      return 0
    else
      attempt=$((attempt - 1))
      echo "$(TZ=GMT-9 date -Iseconds) NG retry $attempt"
      if (( attempt > 0 )); then
        sleep 3
      fi
    fi
  done

  echo "$(TZ=GMT-9 date -Iseconds) Network Error" >&2
  care 2>&1
  return 1
}

main >> "$LOG" 2>> "$ERR"
