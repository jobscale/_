#!/usr/bin/env bash
set -eu

curl -s https://raw.githubusercontent.com/SpiderLabs/ModSecurity/v3/master/modsecurity.conf-recommended \
| sed \
  -e "s/^SecRuleEngine DetectionOnly/SecRuleEngine On/" \
  -e "s/^SecAuditLog \/var\/log\/modsec_audit.log/SecAuditLog \/dev\/stdout/" \
  -e "s/^SecUnicodeMapFile unicode.mapping 20127/SecUnicodeMapFile \/etc\/nginx\/modsecurity\/unicode.mapping 20127/" \
  -e "s/^SecStatusEngine On/SecStatusEngine Off/" \
  -e '$aSecAuditLogFormat JSON' \
  -e '$aSecRuleRemoveById 920350' > ingress-nginx/conf/custom-modsecurity.conf

echo "ネームスペースを作成"
kubectl create namespace ingress-nginx

echo "ConfigMap を作成"
kubectl -n ingress-nginx create configmap modsecurity-config \
  --from-file=custom-modsecurity.conf=ingress-nginx/conf/custom-modsecurity.conf

echo "WAF ModSecurity を作成"
kubectl apply -n ingress-nginx -f ingress-nginx/components.yaml

echo "WAF ModSecurity がロードされているか確認"
sleep 3.3
PODNAME=$( kubectl -n ingress-nginx get pod -l app.kubernetes.io/component=controller -o=jsonpath='{.items[0].metadata.name}' )
echo "Pod $PODNAME"
kubectl -n ingress-nginx exec -it $PODNAME -- nginx -T | grep -i modsecurity

echo "Secret を作成"
rm -fr tls && unzip /home/docker/partner/tls.zip -d tls
kubectl create secret tls jsxjp-tls \
  --cert=tls/jsx.jp/fullchain.pem \
  --key=tls/jsx.jp/privkey.pem

echo "デモアプリを作成"
kubectl create deployment demo --image httpd --port 80
kubectl expose deployment demo --port 80 --target-port 80
kubectl create ingress demo --class=nginx \
  --rule="hello.jsx.jp/*=demo:80,tls=jsxjp-tls"

kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8080:80 &

echo "名前解決 - 127.0.0.1 demo.localdev.me"
echo "127.0.0.1 demo.localdev.me" | sudo tee -a /etc/hosts

echo "通常のアクセス"
sleep 3.3
curl http://demo.localdev.me:8080/
sleep 3.3
curl http://demo.localdev.me:8080/

echo "スクリプトインジェクション"
curl -X POST -d "cmd=<script>" http://demo.localdev.me:8080/

echo "不正な User-Agent"
curl -I http://demo.localdev.me:8080/ -H "User-Agent: Mozilla/5.0 (compatible; Nmap Scripting Engine; http://nmap.org/book/nse.html)"

echo "ローカルファイルインクルージョン (Path Traversal Attack)"
curl -I http://demo.localdev.me:8080/script.php?page=../../../../../../etc/passwd

echo "システムファイルの読み取り"
curl -I http://demo.localdev.me:8080/test.ini

echo "Possible Remote File Inclusion (RFI)"
curl -I http://demo.localdev.me:8080/display.php?FORMAT=http://192.168.11.1/test.txt

echo "クロスサイトスクリプティング (XSS Attack Detected via libinjection)"
curl -I 'http://demo.localdev.me:8080/?script=<script>alert("hello")</script>'

echo "Amazon EC2メタデータ読取り"
curl -I http://demo.localdev.me:8080/?site=http://169.254.169.254/latest/meta-data/

echo "コンテナのログを確認"
kubectl -n ingress-nginx logs $PODNAME | grep ModSecurity:

echo "WAF ModSecurity のログを確認"
PODNAME=$( kubectl -n ingress-nginx get pod -l app.kubernetes.io/component=controller -o=jsonpath='{.items[].metadata.name}' )
kubectl -n ingress-nginx logs $PODNAME | grep '^{"transaction"' \
| jq -r '."transaction" | { time_stamp:."time_stamp", request:."request",  messages:[."messages"[] | { ruleId:."details"."ruleId", message:."message" }] }'

fg

web-deploy() {
  kubectl create deployment web --image ghcr.io/jobscale/web
  kubectl expose deployment web --name web --port 80 --target-port 80
  kubectl apply -f web/ingress.yaml
}
