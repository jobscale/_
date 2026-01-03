# daemon system process

### example

* case systemd

```
  sudo ln -s $(pwd)/example/system/example.service /etc/systemd/system

  sudo systemctl daemon-reload
  sudo systemctl enable example --now
  sudo systemctl status example
  # sudo journalctl -u example.service | cat
  sudo systemctl is-enabled example
```

* case rc.d

```
{
  sudo ln -s $(pwd)/example/init/example /etc/init.d

  sudo update-rc.d example defaults
  # sudo update-rc.d example remove
  sudo /etc/init.d/example start
  sudo /etc/init.d/example status
}
```

### backdoor-os

```
{
  sudo ln -s $(pwd)/backdoor-os/system/backdoor-os.service /etc/systemd/system

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
  sudo ln -s $(pwd)/backdoor-k8s/system/backdoor-k8s.service /etc/systemd/system

  sudo systemctl daemon-reload
  sudo systemctl enable backdoor-k8s --now
  sudo systemctl status backdoor-k8s
  # sudo journalctl -u backdoor-k8s.service | cat
  sudo systemctl is-enabled backdoor-k8s
}
```
