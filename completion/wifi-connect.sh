# wifi-connect 用の Bash 補完関数
_wifi_connect_completion() {
  local cur prev opts
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"

  # 第一引数の候補リスト
  opts="jobs blue blue-5G black green pink Rakuten-5268"

  # 第一引数を補完する場合のみ候補を表示
  if [ $COMP_CWORD -eq 1 ]; then
    COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )
    return 0
  fi
}

# wifi-connect コマンドに補完関数を登録
complete -F _wifi_connect_completion wifi-connect
