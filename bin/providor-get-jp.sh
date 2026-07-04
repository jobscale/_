for i in $(global-log.js 16); do
  IFS=/ read IP MASK <<< "$i"
  echo -n "$IP "
  sleep 5
  INFO=$(whois -h whois.nic.ad.jp $IP/e \
    | awk -F']' '/Network Number|Organization/ {print $2}' \
    | sed 's/^ //g' \
    | xargs)
  if [[ -z "$INFO" ]]; then
    INFO="$IP/$MASK unknown"
  fi
  echo "$INFO"
done
