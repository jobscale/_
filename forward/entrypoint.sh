#!/usr/bin/env bash
set -eu

ssh -N -T container-rem-watch &
PID1=$!

sudo /usr/sbin/sshd -D &
PID2=$!

wait -n $PID1 $PID2
exit $?
