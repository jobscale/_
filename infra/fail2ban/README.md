# Fail2Ban の設定と管理

このドキュメントでは、SSH の Ed25519 鍵認証と組み合わせた、堅牢な `fail2ban` の設定手順についてまとめています。

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

---

## 補足：設定内容のポイント (`jail.local`)

今回の運用で採用している設定の要点です。

* **Ed25519 鍵認証 + ポート22**: 強固な暗号化方式を使用し、ポートスキャンを前提とした「22番ポート」での正攻法な防御。
* **[recidive] セクション**:
    * `findtime = 1w`: 1週間という長期スパンで攻撃を監視。
    * `maxretry = 3`: 期間内に3回 BAN されたIPを特定。
    * `bantime = -1`: 条件に合致した攻撃者を**永久追放**。
* **[Definition] セクション**:
    * `dbpurgeage = 10d`: データベースの履歴を10日間保持し、`recidive` の判定（1週間分）を確実に行えるように調整。
* **複数ポート監視（必要に応じて）**:
    * `port = ssh,2222` のようにカンマ区切りで指定可能。
