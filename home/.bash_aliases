HISTSIZE=500000
HISTFILESIZE=5000000

umask u=rwx,g=,o=
export PROMPT_DIRTRIM=3
export DEBIAN_FRONTEND=noninteractive

if [ "$(which sudo 2>/dev/null)" != "" ]
then
    alias sudo='sudo -E'
else
    alias sudo=''
fi

[[ "" == "${DISPLAY}" ]] && export DISPLAY='localhost:0.0'

alias ul='less_with_unbuffer'
alias diff='colordiff'
alias netstat='netstat -anptu'
alias rsync='rsync -tlrHhv --delete'
alias lsof='sudo lsof -Pan -i tcp -i udp'
alias df='df -x"squashfs"'

PATH="$PATH:$HOME/bin:$HOME/.local/bin"

alias kube-production='ln -sfn kind-config-production $HOME/.kube/config'
alias kube-staging='ln -sfn kind-config-staging $HOME/.kube/config'
alias kube-development='ln -sfn kind-config-development $HOME/.kube/config'
alias kube-gke='ln -sfn gke-config $HOME/.kube/config'
alias kube-eks='ln -sfn eks-config $HOME/.kube/config'
alias kube-aks='ln -sfn aks-config $HOME/.kube/config'

alias d-node='docker run --rm -v $(pwd):/home/node/app --workdir /home/node/app -it node'
alias d-nodejs='docker run --rm -v $(pwd):/home/node/app --workdir /home/node/app --entrypoint /bin/bash -it node'
alias MP4Box='docker run --rm -it -v $(pwd):/work -u $(id -u):$(id -g) jobscale/mp4box'
alias ffmpeg='docker run --rm -it -v $(pwd):/work -u $(id -u):$(id -g) --entrypoint /usr/local/bin/ffmpeg jobscale/mp4box'
alias ffprobe='docker run --rm -it -v $(pwd):/work -u $(id -u):$(id -g) --entrypoint /usr/local/bin/ffprobe jobscale/mp4box'
alias qt-faststart='docker run --rm -it -v $(pwd):/work -u $(id -u):$(id -g) --entrypoint /usr/local/bin/qt-faststart jobscale/mp4box'

[[ -d "$HOME/.bin/android-studio/gradle/gradle-5.1.1/bin" ]] && export GPATH="$HOME/.bin/android-studio/gradle/gradle-5.1.1/bin" && export PATH="$PATH:$GPATH"
[[ -d "$HOME/Android/Sdk" ]] && export ANDROID_HOME="$HOME/Android/Sdk" && export PATH="$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools"

[[ -s "$HOME/.bash_scripts" ]] && . "$HOME/.bash_scripts"
[[ -s "$HOME/.nvm/nvm.sh" ]] && . "$HOME/.nvm/nvm.sh"

[[ -s "$HOME/.bash_aliases_local" ]] && . "$HOME/.bash_aliases_local"

proxyConfigure() {
  disableProxy() {
    export http_proxy=
    export https_proxy=
  }
  [[ $(nc -v 8.8.8.8 53 -w 1 < /dev/null 2>&1 | grep succeeded | wc -l) > 0 ]] && echo "no proxy" && disableProxy
}
proxyConfigure

