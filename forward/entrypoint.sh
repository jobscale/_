#!/usr/bin/env bash
set -eu

# ~/_/daemon/reverse-bastion/reverse-bastion &
ssh -N -T forwarch-rem-watch &
PID1=$!

sudo /usr/sbin/sshd -D &
PID2=$!

wait -n $PID1 $PID2
exit $?
