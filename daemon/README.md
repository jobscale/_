# daemon system process

### example

```
{
  sudo ln -s $(pwd)/example/example /usr/local/bin
  sudo ln -s $(pwd)/example/init/example /etc/init.d
  sudo ln -s $(pwd)/example/system/example.service /etc/systemd/system

  sudo update-rc.d example defaults
  # sudo update-rc.d example remove
  sudo systemctl daemon-reload
  sudo systemctl enable example --now
  sudo systemctl status example
  # sudo journalctl -u example.service | cat
  sudo systemctl is-enabled example
}
```

### backdoor-os

```
{
  sudo ln -s $(pwd)/backdoor-os/backdoor-os /usr/local/bin
  sudo ln -s $(pwd)/backdoor-os/init/backdoor-os /etc/init.d
  sudo ln -s $(pwd)/backdoor-os/system/backdoor-os.service /etc/systemd/system

  sudo update-rc.d backdoor-os defaults
  # sudo update-rc.d backdoor-os remove
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
  sudo ln -s $(pwd)/backdoor-k8s/backdoor-k8s /usr/local/bin
  sudo ln -s $(pwd)/backdoor-k8s/init/backdoor-k8s /etc/init.d
  sudo ln -s $(pwd)/backdoor-k8s/system/backdoor-k8s.service /etc/systemd/system

  sudo update-rc.d backdoor-k8s defaults
  # sudo update-rc.d backdoor-k8s remove
  sudo systemctl daemon-reload
  sudo systemctl enable backdoor-k8s --now
  sudo systemctl status backdoor-k8s
  # sudo journalctl -u backdoor-k8s.service | cat
  sudo systemctl is-enabled backdoor-k8s
}
```
