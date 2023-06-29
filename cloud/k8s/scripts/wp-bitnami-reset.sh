#!/usr/bin/env bash

reset-wp() {
  kubectl -n bitnami delete -f backend/wp-bitnami
  sudo rm -fr /home/k8s/mnt/var/lib/wp-bitnami

  SQL="DROP DATABASE wp_bitnami;"
  kubectl exec -n mariadb -i svc/mariadb -- bash -c "echo \"$SQL\" | mariadb -pfalse"

  SQL="CREATE DATABASE IF NOT EXISTS wp_bitnami;
CREATE USER IF NOT EXISTS 'wp-user'@'%' IDENTIFIED BY 'wp-admin';
GRANT ALL PRIVILEGES ON wp_bitnami.* TO 'wp-user'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;"
  kubectl exec -n mariadb -i svc/mariadb -- bash -c "echo \"$SQL\" | mariadb -pfalse"

  showDB
  kubectl -n bitnami apply -f backend/wp-bitnami
}

reset-cms() {
  kubectl -n wordpress delete -f backend/wordpress
  sudo rm -fr /home/k8s/mnt/var/lib/wordpress

  SQL="DROP DATABASE wordpress;"
  kubectl exec -n mariadb -i svc/mariadb -- bash -c "echo \"$SQL\" | mariadb -pfalse"

  SQL="CREATE DATABASE IF NOT EXISTS wordpress;
CREATE USER IF NOT EXISTS 'wp-user'@'%' IDENTIFIED BY 'wp-admin';
GRANT ALL PRIVILEGES ON wordpress.* TO 'wp-user'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;"
  kubectl exec -n mariadb -i svc/mariadb -- bash -c "echo \"$SQL\" | mariadb -pfalse"

  showDB
  kubectl -n wordpress apply -f backend/wordpress
}

showDB() {
  SQL="SHOW DATABASES;"
  kubectl exec -n mariadb -i svc/mariadb -- bash -c "echo \"$SQL\" | mariadb -pfalse"
}

check() {
  curl -I -sL https://cms.jsx.jp
  curl -I -sL https://wp.jsx.jp
}
