# Fail2Ban の設定と管理

このドキュメントでは `fail2ban` についてまとめています。

## 1. インストールと設定ファイルの配置

まずはパッケージを更新し、Fail2Ban をインストールしてから、作成した設定ファイルを適切なディレクトリへ配置します。

```bash
# パッケージリストの更新
sudo apt update

# Fail2Banのインストール
sudo apt install -y fail2ban

# 設定ファイル (jail.local) を設定ディレクトリへコピー
# ※ /etc/fail2ban/jail.local として配置されます
sudo cp *.local /etc/fail2ban/
```

## 2. 設定の適用

設定ファイルを変更した後は、設定の再読み込みとサービスの再起動を行い、変更を反映させます。

```bash
# 設定の変更を読み込み
sudo fail2ban-client reload

# サービスを再起動して確実に反映
sudo systemctl restart fail2ban
```

## 3. ステータス確認

各 Jail（監視ルール）が正しく動作しているか確認します。

```bash
# SSH監視ルールの確認
sudo fail2ban-client status sshd

# 常習犯（recidive）監視ルールの確認
sudo fail2ban-client status recidive
```
