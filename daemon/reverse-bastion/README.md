# macOS Daemon Configuration

## Initial Setup
```
sudo ln -s $HOME/_/daemon/reverse-bastion/reverse-bastion /usr/local/bin
sudo cp $HOME/_/daemon/reverse-bastion/plist/com.reverse-bastion.plist /Library/LaunchDaemons
```

## List Daemons
```
sudo launchctl list | grep -v apple
```

## Start Daemon
```
sudo launchctl load /Library/LaunchDaemons/com.reverse-bastion.plist
```

## Stop Daemon
```
sudo launchctl unload /Library/LaunchDaemons/com.reverse-bastion.plist
```
