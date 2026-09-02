#!/usr/bin/env bash
set -eu

HTML=logs/show-image.html

echo "<!doctype html>
<style>
:root {
  color-scheme: dark light;
}
body {
  margin: 0;
}
img {
  max-width: 100%;
  height: auto;
}
</style>
" > ${HTML}

for i in $(cd logs && ls sc-image-*.png); do
  echo "<div><img src=\"$i\"></div>" >> ${HTML}
done

google-chrome ${HTML}
