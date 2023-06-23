#!/usr/bin/env bash

reset_wp() {
  kubectl delete -f wp-bitnami
  sudo rm -fr /home/k8s/mnt/var/lib/wp-bitnami

  SQL="DROP DATABASE wp_bitnami;"
  kubectl exec -n mariadb -i svc/mariadb -- bash -c "echo \"$SQL\" | mysql -pfalse"

  SQL="CREATE DATABASE IF NOT EXISTS wp_bitnami;
CREATE USER IF NOT EXISTS 'wp-user'@'%' IDENTIFIED BY 'wp-admin';
GRANT ALL PRIVILEGES ON wp_bitnami.* TO 'wp-user'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;"
  kubectl exec -n mariadb -i svc/mariadb -- bash -c "echo \"$SQL\" | mysql -pfalse"

  showDB
  kubectl apply -f wp-bitnami
}

reset_cms() {
  kubectl delete -f wordpress
  sudo rm -fr /home/k8s/mnt/var/lib/wordpress

  SQL="DROP DATABASE wordpress;"
  kubectl exec -n mariadb -i svc/mariadb -- bash -c "echo \"$SQL\" | mysql -pfalse"

  SQL="CREATE DATABASE IF NOT EXISTS wordpress;
CREATE USER IF NOT EXISTS 'wp-user'@'%' IDENTIFIED BY 'wp-admin';
GRANT ALL PRIVILEGES ON wordpress.* TO 'wp-user'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;"
  kubectl exec -n mariadb -i svc/mariadb -- bash -c "echo \"$SQL\" | mysql -pfalse"

  showDB
  kubectl apply -f wordpress
}

showDB() {
  SQL="SHOW DATABASES;"
  kubectl exec -n mariadb -i svc/mariadb -- bash -c "echo \"$SQL\" | mysql -pfalse"
}

check() {
  curl -i -sL https://cms.jsx.jp
  curl -i -sL https://wp.jsx.jp
}
