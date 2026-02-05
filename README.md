# GAS Ticket Planner

Google Apps Script (GAS) を使用したBacklog連携ガントチャート可視化システム

## 概要

Googleスプレッドシート上でBacklogと連携し、以下の機能を提供します：

- **チケット作成**: テンプレートベースで親子チケットをBacklogに一括作成
- **ガント可視化**: Backlogのチケットをガントチャートで表示
- **営業日計算**: 土日祝日を考慮した日程計算

## クイックスタート

### 1. 依存関係インストール

```bash
npm install
```

### 2. clasp認証

```bash
npx clasp login
```

### 3. clasp設定ファイル作成

```bash
cp .clasp.example.json .clasp.dev.json
```

`.clasp.dev.json` を編集し、GASプロジェクトのスクリプトIDを設定：

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "./dist"
}
```

> スクリプトIDの取得方法: Googleスプレッドシート > 拡張機能 > Apps Script > プロジェクトの設定 > スクリプトID

### 4. デプロイ

```bash
npm run push:dev
```

## 開発

```bash
# テスト実行
npm test

# 型チェック
npm run typecheck

# ビルド＆デプロイ（開発環境）
npm run push:dev
```

## ドキュメント

詳細なドキュメントは [docs/](./docs/) を参照してください：

- [README.md](./docs/README.md) - 環境構築・開発フロー
- [spec.md](./docs/spec.md) - 要件定義・シート仕様
- [design.md](./docs/design.md) - アーキテクチャ設計

## ライセンス

MIT
