# bash completion for VBoxManage (auto-detect VM names)

_vboxmanage_complete() {
  local cur prev subcmd vms

  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"

  # サブコマンド
  subcmd="list startvm controlvm showvminfo"

  # VM 名を自動抽出（Name: の後ろだけ取る）
  vms="$(VBoxManage list vms --long 2>/dev/null | awk '/^Name:/ {print $2}')"

  case "$prev" in
    startvm|controlvm|showvminfo)
      COMPREPLY=( $(compgen -W "$vms" -- "$cur") )
      return 0
      ;;
    list)
      COMPREPLY=( $(compgen -W "vms runningvms ostypes" -- "$cur") )
      return 0
      ;;
  esac

  # 第1引数（サブコマンド）
  if [[ $COMP_CWORD -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "$subcmd" -- "$cur") )
    return 0
  fi
}

complete -F _vboxmanage_complete VBoxManage
