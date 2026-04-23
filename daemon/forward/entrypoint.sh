#!/usr/bin/env bash
set -eu

~/_/daemon/port-nodejs/port-nodejs &
PID1=$!

sudo /usr/sbin/sshd -D &
PID2=$!

wait -n $PID1 $PID2
exit $?
