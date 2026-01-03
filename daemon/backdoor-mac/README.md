# macOS Daemon Configuration

## Initial Setup
```
sudo cp /opt/_/daemon/backdoor-mac/plist/com.backdoor-mac.plist /Library/LaunchDaemons
```

## List Daemons
```
sudo launchctl list | grep -v apple
```

## Start Daemon
```
sudo launchctl load /Library/LaunchDaemons/com.backdoor-mac.plist
```

## Stop Daemon
```
sudo launchctl unload /Library/LaunchDaemons/com.backdoor-mac.plist
```
