#!/bin/bash

~/bin/run-node ~/projects/node/speedtest-slack

jiyu() {
  ~/bin/run-node ~/projects/node/post-slack --text '自由要塞戦 <https://chouseisan.com|Click here>'
}

day3() {
  ~/bin/run-node ~/projects/node/itnews
}

day6() {
  ~/bin/run-node ~/projects/node/it
}

# 火曜日
[ $(date '+%u') -eq 2 ] && jiyu

# 3日おき
[ $(expr \( $(date +%s) - $(date -d'2015/10/22' +%s) \) / 60 / 60 / 24 % 3) -eq 0 ] && day3

# 6日おき
[ $(expr \( $(date +%s) - $(date -d'2015/10/22' +%s) \) / 60 / 60 / 24 % 6) -eq 0 ] && day6
