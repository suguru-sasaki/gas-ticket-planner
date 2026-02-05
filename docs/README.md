# GAS Ticket Planner

Google Apps Script (GAS) を使用したBacklog連携ガントチャート可視化システム

## 概要

Googleスプレッドシート上で以下の機能を提供します：

- **ガント可視化**: Backlogのチケットをガントチャートで表示
- **テンプレート管理**: 親子チケット構造をテンプレート定義
- **環境分離**: dev/prod環境への個別デプロイ対応
- **自動初期化**: スプレッドシートを開くと必要なシートを自動作成

> **注意**: チケット管理はBacklog上で行います。スプレッドシート上の「チケット作成」機能はBacklog連携実装前のスタンドアロン版（テスト・デモ用）です。

## 技術スタック

| 項目 | 技術 |
|-----|------|
| 言語 | TypeScript |
| ランタイム | Google Apps Script (V8) |
| ビルド | esbuild (IIFE形式でバンドル) |
| デプロイ | clasp |
| テスト | Jest + ts-jest |
| Lint | ESLint |
| Format | Prettier |
| CI | GitHub Actions |

---

## リポジトリ構成

```
gas-ticket-planner/
├── .github/
│   └── workflows/
│       └── test.yml              # CI設定
├── docs/
│   ├── README.md                 # 本ドキュメント
│   ├── spec.md                   # 要件定義・シート仕様
│   ├── design.md                 # アーキテクチャ設計
│   ├── test-plan.md              # テスト計画
│   └── progress.md               # 進捗管理
├── src/
│   ├── main.ts                   # エントリポイント（グローバル関数定義）
│   ├── domain/
│   │   ├── models/
│   │   │   ├── Ticket.ts
│   │   │   ├── Template.ts
│   │   │   ├── Assignee.ts
│   │   │   ├── GanttRow.ts
│   │   │   └── Settings.ts
│   │   ├── services/
│   │   │   ├── TicketService.ts
│   │   │   ├── GanttService.ts
│   │   │   └── TemplateService.ts
│   │   └── utils/
│   │       ├── DateUtils.ts
│   │       ├── MemoExtractor.ts
│   │       ├── IdGenerator.ts
│   │       └── Validator.ts
│   ├── infra/
│   │   ├── SpreadsheetWrapper.ts
│   │   ├── SheetInitializer.ts   # シート自動初期化
│   │   ├── SheetNames.ts
│   │   └── repositories/
│   │       ├── TicketRepository.ts
│   │       ├── TemplateRepository.ts
│   │       ├── AssigneeRepository.ts
│   │       └── SettingsRepository.ts
│   ├── errors/
│   │   └── AppError.ts
│   └── types/
│       └── index.ts
├── html/
│   ├── create-ticket.html        # チケット作成フォーム
│   └── gantt-dialog.html         # ガント生成ダイアログ
├── tests/
│   ├── setup.ts                  # テストセットアップ
│   ├── helpers/
│   │   └── MockSpreadsheet.ts    # モック実装
│   ├── unit/
│   │   └── domain/
│   │       └── utils/
│   │           ├── DateUtils.test.ts
│   │           ├── MemoExtractor.test.ts
│   │           └── ...
│   └── integration/
│       └── GanttGeneration.test.ts
├── dist/                         # ビルド成果物（clasp push対象）
├── esbuild.config.mjs            # esbuildビルド設定
├── .clasp.json                   # 現在の環境設定（gitignore対象）
├── .clasp.example.json           # clasp設定のテンプレート
├── appsscript.json               # GASマニフェスト
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
└── .gitignore
```

---

## 環境構築

### 前提条件

- Node.js v20以上
- npm v10以上
- Google アカウント
- clasp（グローバルインストール済み、または npx 使用）

### 1. リポジトリクローン

```bash
git clone <repository-url>
cd gas-ticket-planner
```

### 2. 依存関係インストール

```bash
npm install
```

### 3. clasp認証

```bash
npx clasp login
```

ブラウザが開くのでGoogleアカウントで認証してください。

### 4. GASプロジェクト作成

#### clasp設定ファイルの作成

```bash
# テンプレートから設定ファイルを作成
cp .clasp.example.json .clasp.dev.json
cp .clasp.example.json .clasp.prod.json
```

#### 開発環境

1. Googleスプレッドシートを新規作成
2. 「拡張機能」→「Apps Script」を開く
3. 「プロジェクトの設定」→「スクリプトID」をコピー
4. `.clasp.dev.json` を編集してスクリプトIDを設定

```json
{
  "scriptId": "YOUR_DEV_SCRIPT_ID",
  "rootDir": "./dist"
}
```

#### 本番環境

同様に本番用スプレッドシートを作成し、`.clasp.prod.json` を編集

```json
{
  "scriptId": "YOUR_PROD_SCRIPT_ID",
  "rootDir": "./dist"
}
```

> **注意**: `.clasp.dev.json` と `.clasp.prod.json` は `.gitignore` に含まれており、リポジトリにはコミットされません。

### 5. 初期デプロイ

```bash
# 開発環境へデプロイ
npm run push:dev

# スプレッドシートを開く（シートは自動で初期化されます）
npm run open:dev
```

---

## 開発フロー

### 日常の開発

```bash
# 1. コードを編集

# 2. 型チェック
npm run typecheck

# 3. テスト実行
npm test

# 4. ビルド＆プッシュ
npm run push:dev

# 5. 動作確認
npm run open:dev
```

### コード品質チェック

```bash
# Lint
npm run lint

# Lint + 自動修正
npm run lint:fix

# フォーマット
npm run format

# 型チェック
npm run typecheck

# 全チェック（CI相当）
npm run check
```

### テスト

```bash
# 全テスト実行
npm test

# カバレッジ付き
npm run test:coverage

# 特定ファイル
npm test -- DateUtils.test.ts
```

---

## デプロイ

### 開発環境

```bash
npm run push:dev
```

### 本番環境

```bash
# 本番デプロイ前にすべてのテストが通ることを確認
npm run check
npm test

# 本番環境へデプロイ
npm run push:prod
```

### デプロイ前チェックリスト

- [ ] 全テストがパス
- [ ] lint/formatエラーなし
- [ ] 型エラーなし
- [ ] 開発環境で動作確認済み
- [ ] progress.md の該当タスクを完了

---

## npm scripts 一覧

| コマンド | 説明 |
|---------|------|
| `npm run build` | esbuildでバンドル（GAS用IIFE形式） |
| `npm run build:tsc` | TypeScriptコンパイル（tsc使用） |
| `npm run build:watch` | ウォッチモードでtscビルド |
| `npm run lint` | ESLintを実行 |
| `npm run lint:fix` | ESLint + 自動修正 |
| `npm run format` | Prettierでフォーマット |
| `npm run typecheck` | 型チェック |
| `npm run check` | lint + typecheck |
| `npm test` | テスト実行 |
| `npm run test:watch` | ウォッチモードでテスト |
| `npm run test:coverage` | カバレッジ付きテスト |
| `npm run env:dev` | 開発環境に切り替え |
| `npm run env:prod` | 本番環境に切り替え |
| `npm run push:dev` | 開発環境へデプロイ |
| `npm run push:prod` | 本番環境へデプロイ |
| `npm run open:dev` | 開発環境を開く |
| `npm run open:prod` | 本番環境を開く |

---

## シート構造

スプレッドシートを開くと、以下のシートが自動的に作成されます（左から順）：

### 1. 使い方シート

ユーザー向けの操作説明を記載

### 2. 担当者リストシート

| 列 | 内容 |
|----|------|
| A | 担当者名 |
| B | メールアドレス |

### 3. テンプレートシート

| 列 | 内容 |
|----|------|
| A | テンプレート名 |
| B | 説明文 |
| C | 開始日オフセット |
| D | 期間（日数） |

### 4. 可視化設定シート

| 設定項目 | デフォルト値 |
|---------|-------------|
| 親チケット色 | #4285F4 |
| 子チケット色_未着手 | #E0E0E0 |
| 子チケット色_進行中 | #FFC107 |
| 子チケット色_完了 | #4CAF50 |
| 土曜日色 | #BBDEFB |
| 日曜日色 | #FFCDD2 |
| 祝日色 | #FFCDD2 |
| ヘッダ背景色 | #E3F2FD |

### 5. チケット管理シート

| 列 | 内容 |
|----|------|
| A | チケットID |
| B | 親チケットID |
| C | チケット種別 |
| D | チケット名 |
| E | 説明文 |
| F | 担当者 |
| G | 状態 |
| H | 開始日 |
| I | 終了日 |
| J | 作成日時 |

---

## トラブルシューティング

### clasp push が失敗する

```bash
# 再認証
npx clasp logout
npx clasp login

# .clasp.json の scriptId を確認
cat .clasp.json
```

### GASでエラーが発生する

1. スプレッドシートの「拡張機能」→「Apps Script」でログを確認
2. `console.log()` でデバッグ出力を追加
3. 開発環境で再現・修正してから本番デプロイ

### テストが失敗する

```bash
# 詳細なエラー出力
npm test -- --verbose

# 特定のテストのみ実行
npm test -- -t "テスト名"
```

### シートが自動作成されない

1. Apps Scriptエディタで`onOpen`関数を手動実行
2. 必要な権限を承認
3. スプレッドシートを再読み込み

---

## 運用ルール

### ブランチ戦略

- `main`: 本番環境用（直接コミット禁止）
- `develop`: 開発環境用
- `feature/*`: 機能開発用

### コミットメッセージ

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・設定変更
```

### プルリクエスト

1. `feature/*` ブランチで開発
2. テストがパスすることを確認
3. `develop` へPR作成
4. レビュー後マージ
5. 開発環境で動作確認
6. 問題なければ `main` へマージ
7. 本番環境へデプロイ

---

## 関連ドキュメント

- [spec.md](./spec.md) - 要件定義・シート仕様
- [design.md](./design.md) - アーキテクチャ設計
- [test-plan.md](./test-plan.md) - テスト計画
- [progress.md](./progress.md) - 進捗管理
