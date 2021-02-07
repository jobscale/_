### Installation
```
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
sudo add-apt-repository "deb http://packages.cloud.google.com/apt cloud-sdk-$(lsb_release -cs) main"
sudo apt install -y google-cloud-sdk
```

### Setup
```
gcloud container clusters get-credentials default --zone asia-east1-c --project project
```

### allow ssh on Cloud Shell
```
gcloud alpha cloud-shell ssh
```
