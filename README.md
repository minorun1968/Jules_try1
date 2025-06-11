# リアルタイム世界情勢ダッシュボード

> GDELTプロジェクトのデータをGoogle Maps上にリアルタイムで可視化する、Next.js製のインタラクティブダッシュボードです。

## ⚠️ 開発ステータス (Project Status)

**このプロジェクトは現在、活発に開発が進行中の実験的なアプリケーションです。**

機能の追加・変更が頻繁に行われたり、予期せぬバグが発生する可能性があります。安定版としてのご利用はまだお勧めできませんので、ご了承ください。

---

世界中の出来事（ニュースイベント）を地図上にプロットし、その感情（トーン）を色で表現することで、世界で今何が起きているかを直感的に把握することができます。

## スクリーンショット

![アプリケーションのスクリーンショット](https://placehold.co/800x500/242f3e/ffffff?text=ここにアプリの\nスクリーンショットを挿入)
*(この部分を、実際に動作しているアプリケーションのスクリーンショットに差し替えることをお勧めします)*

---

## 主な機能 ✨

* **リアルタイムデータ取得:** Google BigQuery上のGDELT公開データセットから、最新のイベント情報を取得します。
* **地図へのプロット:** 取得したイベントを、発生した地理座標に基づいてGoogle Maps上に表示します。
* **感情の可視化:** ニュースの論調（`AvgTone`）を分析し、ポジティブ（緑）、ネガティブ（赤）、中立（青）で色分けします。
* **インタラクティブ操作:**
    * データ点をクリックすると、関連するニュース記事のURLが新しいタブで開きます。
    * データ点にカーソルを合わせると、ニュースのURLがツールチップで表示されます。
* **データ更新機能:** 「データ再読込」ボタンで、いつでも最新の情報に更新できます。
* **コンテナ化:** Dockerを使って、誰でも簡単に開発環境を再現できます。

---

## 使用技術 🛠️

* **フレームワーク:** Next.js (React)
* **データ可視化:** Deck.gl
* **地図:** Google Maps Platform
* **データソース:** Google BigQuery (GDELT Project)
* **開発環境:** Docker / Docker Compose
* **言語:** JavaScript

---

## セットアップ手順 🚀

このアプリケーションをローカル環境で実行するための手順です。

### 1. リポジトリをクローン

```bash
git clone [https://github.com/minorun1968/Jules_try1.git](https://github.com/minorun1968/Jules_try1.git)
cd Jules_try1
```

### 2. 環境変数の設定

プロジェクトのルートにある`.env.local.example`ファイルをコピーして、`.env.local`という名前のファイルを作成します。

```bash
cp .env.local.example .env.local
```

次に、作成した`.env.local`ファイルを開き、**あなた自身の**キーと認証情報を設定します。

```plaintext
# .env.local ファイル

# --- 1. Google Cloud Platformのサービスアカウントキー ---
# GCPからダウンロードしたJSONキーファイルの中身を
# "改行を削除して一行にした文字列" として貼り付けてください。
# 全体をシングルクォート(')で囲むのがポイントです。
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type": "service_account", "project_id": "your-gcp-project-id", ...}'

# --- 2. Google Maps PlatformのAPIキー ---
# Maps JavaScript APIを有効化したプロジェクトのAPIキーを貼り付けてください。
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="ここにあなたのGoogle Maps APIキーを貼り付け"
```

#### **認証情報の取得方法**

* **`GOOGLE_APPLICATION_CREDENTIALS_JSON`**:
    1.  GCPコンソールでサービスアカウントを作成または選択します。
    2.  そのサービスアカウントに「**BigQuery データ閲覧者**」と「**BigQuery ユーザー**」のロールを付与します。
    3.  新しいキー（JSON形式）を作成してダウンロードします。
    4.  ダウンロードしたファイルの中身全体をコピーし、改行を削除して一行の文字列にしてから、`.env.local`ファイルに貼り付けます。

* **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`**:
    1.  GCPコンソールでAPIキーを作成または選択します。
    2.  そのキーを使用するプロジェクトで「**Maps JavaScript API**」が有効になっていることを確認してください。

### 3. アプリケーションの起動

以下のコマンドを実行して、Dockerコンテナをビルドし、起動します。

```bash
docker-compose up --build
```

初回起動時はビルドに数分かかることがあります。起動後、ブラウザで **[http://localhost:3000](http://localhost:3000)** にアクセスしてください。ダッシュボードが表示されれば成功です！

---

## ライセンス

このプロジェクトは [MIT License](LICENSE.md) のもとで公開されています。

## 謝辞

このプロジェクトは、素晴らしいデータセットを公開している [GDELT Project](https://www.gdeltproject.org/) に大きく依存しています。
