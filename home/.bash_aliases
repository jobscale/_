HISTSIZE=500000
HISTFILESIZE=5000000
PROMPT_DIRTRIM=3
PATH="$PATH:$HOME/bin:$HOME/.local/bin"

export DEBIAN_FRONTEND=noninteractive
export TZ=Asia/Tokyo

[[ $(uname -s) == "Linux" ]] && umask u=rwx,g=,o=
[[ $(uname -s) == "Darwin" ]] && umask u=rwx,g=rx,o=rx

alias ul='less_with_unbuffer'
alias diff='colordiff'
alias rsync='rsync -tlrHhv --delete'
alias netstat='sudo netstat -anptu'
alias lsof='sudo lsof -Pan -i tcp -i udp'
alias ss='sudo ss -tnl'
[[ $(uname -s) == "Linux" ]] && alias df='df -x"squashfs"'

alias kube-production='ln -sfn kind-config-production $HOME/.kube/config'
alias kube-staging='ln -sfn kind-config-staging $HOME/.kube/config'
alias kube-development='ln -sfn kind-config-development $HOME/.kube/config'
alias kube-gke='ln -sfn gke-config $HOME/.kube/config'
alias kube-eks='ln -sfn eks-config $HOME/.kube/config'
alias kube-aks='ln -sfn aks-config $HOME/.kube/config'

alias d-node='docker run --rm -v $(pwd):/home/node/app -u $(id -u):$(id -g) --workdir /home/node/app -it node:lts-buster-slim'
alias d-nodejs='docker run --rm -v $(pwd):/home/node/app -u $(id -u):$(id -g) --workdir /home/node/app --entrypoint /bin/bash -it node:lts-buster-slim'
alias MP4Box='docker run --rm -it -v $(pwd):/work -u $(id -u):$(id -g) jobscale/mp4box'
alias ffmpeg='docker run --rm -it -v $(pwd):/work -u $(id -u):$(id -g) --entrypoint /usr/local/bin/ffmpeg jobscale/mp4box'
alias ffprobe='docker run --rm -it -v $(pwd):/work -u $(id -u):$(id -g) --entrypoint /usr/local/bin/ffprobe jobscale/mp4box'
alias qt-faststart='docker run --rm -it -v $(pwd):/work -u $(id -u):$(id -g) --entrypoint /usr/local/bin/qt-faststart jobscale/mp4box'

[[ -d "$HOME/.bin/android-studio/gradle/gradle-5.1.1/bin" ]] && GPATH="$HOME/.bin/android-studio/gradle/gradle-5.1.1/bin" && PATH="$PATH:$GPATH"
[[ -d "$HOME/Android/Sdk" ]] && ANDROID_HOME="$HOME/Android/Sdk" && PATH="$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools"

[[ -s "$HOME/.bash_scripts" ]] && . "$HOME/.bash_scripts"
[[ -s "$HOME/.bash_local" ]] && . "$HOME/.bash_local"
[[ -s "$HOME/.nvm/nvm.sh" ]] && . "$HOME/.nvm/nvm.sh"

if [ "$(which sudo 2> /dev/null)" != "" ]
then alias sudo='sudo -E'
else alias sudo=''
fi

[[ "${DISPLAY}" == "" ]] && DISPLAY='localhost:0.0'

setFW() {
  sudo iptables -F INPUT
  sudo iptables -I INPUT -p icmp -i ext_if ! -s 49.135.0.0/16 -j DROP
  sudo iptables -A INPUT -p icmp -s 49.135.0.0/16 -j ACCEPT
  sudo iptables -A INPUT -p icmp -j DROP
}
# [[ $(which sudo) != "" && $(which sudo iptables) != "" ]] && setFW

proxyConfigure() {
  disableProxy() {
    echo "no proxy"
    export http_proxy=
    export https_proxy=
  }
  [[ $(nc -vz -w 1 8.8.8.8 53 2>&1 | grep succeeded | wc -l) > 0 ]] && disableProxy
}
proxyConfigure
