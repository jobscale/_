#!/usr/bin/env bash

check() {
  sleep $1
  echo "sleep $1 done"
}

threadLoop() {
  TH_MAX=3
  echo "$@"
  lockTmp=$(mktemp)
  echo $lockTmp
  rm -f $lockTmp
  mkfifo $lockTmp
  echo

  counter=0
  for ip in $@
  do
    if [ $counter -lt $TH_MAX ]
    then
      { time echo -en "\n$(check $ip)"; echo $ip > $lockTmp; } &
      let $[counter++];
    else
      read x < $lockTmp
      { time echo -en "\n$(check $ip)"; echo $ip > $lockTmp; } &
    fi
  done

  for i in $(seq 1 $TH_MAX)
  do
    read x < $lockTmp
  done

  rm $lockTmp
  echo finish
}

{
  LIST=(
    $(echo "scale=3; ($RANDOM / 10000) + 1" | bc -l)
    $(echo "scale=3; ($RANDOM / 10000) + 1" | bc -l)
    $(echo "scale=3; ($RANDOM / 10000) + 1" | bc -l)
    $(echo "scale=3; ($RANDOM / 10000) + 1" | bc -l)
    $(echo "scale=3; ($RANDOM / 10000) + 1" | bc -l)
    $(echo "scale=3; ($RANDOM / 10000) + 1" | bc -l)
    $(echo "scale=3; ($RANDOM / 10000) + 1" | bc -l)
    $(echo "scale=3; ($RANDOM / 10000) + 1" | bc -l)
    $(echo "scale=3; ($RANDOM / 10000) + 1" | bc -l)
    $(echo "scale=3; ($RANDOM / 10000) + 1" | bc -l)
  )

  threadLoop ${LIST[@]}
}
