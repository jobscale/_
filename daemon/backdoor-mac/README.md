# macOS Daemon Configuration

## Initial Setup
```
sudo ln -s $HOME/_/daemon/backdoor-mac/backdoor-mac /usr/local/bin
sudo cp $HOME/_/daemon/backdoor-mac/plist/com.backdoor-mac.plist /Library/LaunchDaemons
```

## List Daemons
```
launchctl list | grep -v apple | sort
```

## Start Daemon
```
sudo launchctl load /Library/LaunchDaemons/com.backdoor-mac.plist
```

## Stop Daemon
```
sudo launchctl unload /Library/LaunchDaemons/com.backdoor-mac.plist
```
