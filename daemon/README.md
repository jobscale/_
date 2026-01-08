# daemon system process

### example

* case systemd

```
  sudo ln -sfn /opt/_/daemon/example/system/example.service /etc/systemd/system

  sudo systemctl daemon-reload
  sudo systemctl enable example --now
  sudo systemctl status example
  # sudo journalctl -u example.service | cat
  sudo systemctl is-enabled example
```

* case rc.d

```
{
  sudo ln -sfn /opt/_/daemon/example/init/example /etc/init.d

  sudo update-rc.d example defaults
  # sudo update-rc.d example remove
  sudo /etc/init.d/example start
  sudo /etc/init.d/example status
}
```

### backdoor-os

```
{
  sudo ln -sfn /opt/_/daemon/backdoor-os/system/backdoor-os.service /etc/systemd/system

  sudo systemctl daemon-reload
  sudo systemctl enable backdoor-os --now
  sudo systemctl status backdoor-os
  # sudo journalctl -u backdoor-os.service | cat
  sudo systemctl is-enabled backdoor-os
}
```


### backdoor-k8s

```
{
  sudo ln -sfn /opt/_/daemon/backdoor-k8s/system/backdoor-k8s.service /etc/systemd/system

  sudo systemctl daemon-reload
  sudo systemctl enable backdoor-k8s --now
  sudo systemctl status backdoor-k8s
  # sudo journalctl -u backdoor-k8s.service | cat
  sudo systemctl is-enabled backdoor-k8s
}
```

### remote-sensors

```
{
  sudo ln -sfn /opt/_/daemon/remote-sensors/system/remote-sensors.service /etc/systemd/system

  sudo systemctl daemon-reload
  sudo systemctl enable remote-sensors --now
  sudo systemctl status remote-sensors
  # sudo journalctl -u remote-sensors.service | cat
  sudo systemctl is-enabled remote-sensors
}
```
