# macOS Daemon Configuration

## Initial Setup
```
sudo cp /opt/_/daemon/reverse-bastion/plist/com.reverse-bastion.plist /Library/LaunchDaemons
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
