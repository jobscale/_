# syslog udp port 514

## settings

file: /etc/rsyslog.conf

```
# provides TCP syslog reception
module(load="imudp")
input(type="imudp" port="514")
```

file: /etc/rsyslog.d/24-user.conf

```
user.*   /var/log/user.log
```

file: /etc/rsyslog.d/25-local.conf

```
local0.*   /var/log/local.log
local1.*   /var/log/local.log
local2.*   /var/log/local.log
local3.*   /var/log/local.log
local4.*   /var/log/local.log
local5.*   /var/log/local.log
local6.*   /var/log/local.log
local7.*   /var/log/local.log
```

file: /etc/logrotate.d/rsyslog

```
  /var/log/cron.log
  /var/log/debug
  /var/log/messages
+ /var/log/local.log
```

## restart daemon

```
sudo /etc/init.d/rsyslog restart
```

## watch logs

```
tail -f /var/log/local1.log
```

## logging

```
logger -p local0.info $(date +%s%3N)
logger -n 127.0.0.1 -P 514 -p local0.info $(date +%s%3N)
```
