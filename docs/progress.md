# 進捗管理 (progress.md)

## 概要

このドキュメントはプロジェクトの進捗をチェックリスト形式で管理します。

**最終更新**: 2026-02-03

---

## Phase 1: ドキュメント作成

### 1.1 設計ドキュメント

- [x] docs/spec.md - 要件定義・シート仕様
  - [x] シート構成の定義
  - [x] 各シートのカラム定義
  - [x] 親子関係の表現方法
  - [x] 状態定義
  - [x] メニュー構成
  - [x] HTMLフォーム仕様
  - [x] ガント生成仕様
  - [x] エラー仕様

- [x] docs/design.md - アーキテクチャ設計
  - [x] レイヤー構成
  - [x] モジュール分割
  - [x] データモデル
  - [x] 主要関数設計
  - [x] Spreadsheet I/O最適化
  - [x] HTML ↔ GAS通信設計
  - [x] 設定の読み込み
  - [x] 環境分離（dev/prod）
  - [x] テスト容易性のためのDI
  - [x] エラー設計

- [x] docs/test-plan.md - テスト計画
  - [x] テスト戦略概要
  - [x] 単体テストケース一覧
  - [x] 結合テスト戦略と選定理由
  - [x] E2Eテストケース
  - [x] テスト実行環境設定

- [x] docs/progress.md - 進捗管理
  - [x] チェックリスト作成

### 1.2 運用ドキュメント

- [x] docs/README.md - プロジェクト概要
  - [x] プロジェクト概要
  - [x] 環境構築手順
  - [x] 開発フロー
  - [x] デプロイ手順
  - [x] 運用ルール

---

## Phase 2: プロジェクトセットアップ

### 2.1 リポジトリ初期化

- [ ] Git初期化
  - [ ] `git init`
  - [x] .gitignore作成
  - [ ] 初期コミット

### 2.2 Node.js環境

- [x] package.json作成
  - [x] 基本設定
  - [x] dependencies
  - [x] devDependencies
  - [x] scripts

- [x] TypeScript設定
  - [x] tsconfig.json作成
  - [x] GAS用の型設定

- [x] Linter/Formatter設定
  - [x] ESLint設定
  - [x] Prettier設定

### 2.3 clasp設定

- [x] clasp初期設定
  - [ ] clasp login（ユーザー操作必要）
  - [x] .clasp.dev.json作成
  - [x] .clasp.prod.json作成
  - [x] appsscript.json作成

### 2.4 テスト環境

- [x] Jest設定
  - [x] jest.config.js
  - [x] tests/setup.ts
  - [x] モックヘルパー作成

### 2.5 CI/CD

- [x] GitHub Actions設定
  - [x] .github/workflows/test.yml
  - [x] lint + typecheck + test

---

## Phase 3: 基盤実装

### 3.1 インフラストラクチャ層

- [x] SpreadsheetWrapper
  - [x] インターフェース定義
  - [x] 本番実装
  - [x] モック実装

- [x] SheetNames定数
  - [x] シート名定義

- [x] AppError
  - [x] エラークラス実装
  - [x] エラーコード定義

### 3.2 リポジトリ層

- [ ] TicketRepository
  - [ ] findAll()
  - [ ] findByParentId()
  - [ ] saveAll()
  - [ ] getNextId()

- [ ] TemplateRepository
  - [ ] findAll()

- [ ] AssigneeRepository
  - [ ] findAll()
  - [ ] findByName()

- [ ] SettingsRepository
  - [ ] getSettings()
  - [ ] resetToDefault()

---

## Phase 4: ドメイン層実装

### 4.1 ユーティリティ

- [x] DateUtils
  - [x] addDays()
  - [x] daysBetween()
  - [x] generateDateRange()
  - [x] getDayOfWeek()
  - [x] isWeekend()
  - [x] isToday()
  - [x] format()
  - [x] isOverlapping()
  - [x] 単体テスト

- [x] MemoExtractor
  - [x] extract()
  - [x] 単体テスト

- [x] IdGenerator
  - [x] generateTicketId()
  - [x] extractNumber()
  - [x] 単体テスト

- [x] Validator
  - [x] validateTicketName()
  - [x] validateDate()
  - [x] validateDateRange()
  - [x] validateColorCode()
  - [ ] 単体テスト

### 4.2 モデル

- [x] Ticket型定義
- [x] Template型定義
- [x] Assignee型定義
- [x] GanttRow型定義
- [x] Settings型定義

### 4.3 サービス

- [ ] TemplateService
  - [ ] expandTemplates()
  - [ ] 単体テスト

- [ ] TicketService
  - [ ] createParentWithChildren()
  - [ ] getTicketsInPeriod()
  - [ ] 単体テスト

- [ ] GanttService
  - [ ] generateGanttData()
  - [ ] createGanttSheet()
  - [ ] generateColorMatrix()
  - [ ] filterTicketsByPeriod()
  - [ ] calculateDateRange()
  - [ ] 単体テスト

---

## Phase 5: UI層実装

### 5.1 HTML

- [x] create-ticket.html
  - [x] フォームUI
  - [x] バリデーション（クライアント）
  - [x] GAS通信処理
  - [x] エラー表示
  - [x] スタイリング

- [x] gantt-dialog.html
  - [x] フォームUI
  - [x] バリデーション（クライアント）
  - [x] GAS通信処理
  - [x] エラー表示
  - [x] スタイリング

### 5.2 コントローラ

- [ ] MenuController
  - [ ] onOpen()
  - [ ] メニュー登録

- [ ] UiController
  - [ ] showCreateTicketDialog()
  - [ ] showGanttDialog()
  - [ ] createTicket()
  - [ ] generateGantt()
  - [ ] resetSettings()
  - [ ] showHelp()

- [ ] DialogService
  - [ ] showAlert()
  - [ ] showToast()

### 5.3 グローバル関数（main.ts）

- [x] onOpen() (スケルトン)
- [x] getAssigneeList() (スケルトン)
- [x] createTicket() (スケルトン)
- [x] generateGantt() (スケルトン)

---

## Phase 6: 結合テスト

- [ ] ガント生成結合テスト
  - [ ] シート生成確認
  - [ ] ヘッダ設定確認
  - [ ] データ展開確認
  - [ ] 固定設定確認
  - [ ] 色設定確認
  - [ ] エラーケース確認

- [ ] チケット作成結合テスト
  - [ ] 親子作成確認
  - [ ] シート保存確認
  - [ ] 担当者バリデーション確認
  - [ ] 日付計算確認

---

## Phase 7: デプロイ・検証

### 7.1 開発環境デプロイ

- [ ] dev用スプレッドシート作成
- [ ] clasp push:dev
- [ ] 初期シート構造作成
- [ ] E2Eテスト実行
  - [ ] E01: チケット作成（正常系）
  - [ ] E02: チケット作成（バリデーション）
  - [ ] E03: ガント生成（正常系）
  - [ ] E04: ガント生成（対象なし）
  - [ ] E05: 列・行固定確認
  - [ ] E06: 色設定変更
  - [ ] E07: 設定初期化
  - [ ] E08: メモ抽出確認

### 7.2 本番環境デプロイ

- [ ] prod用スプレッドシート作成
- [ ] clasp push:prod
- [ ] 初期シート構造作成
- [ ] 動作確認

---

## Phase 8: ドキュメント完成

- [ ] docs/README.md完成
  - [ ] 最終的な構成反映
  - [ ] トラブルシューティング追加
  - [ ] FAQ追加

- [ ] 使い方シートの内容作成
  - [ ] 操作手順
  - [ ] 注意事項
  - [ ] エラー対処

---

## 品質ゲート確認

### ドキュメント品質

- [x] spec.mdがレビュー可能な粒度で完成
- [x] design.mdに「モジュール分割」記載
- [x] design.mdに「入力バリデーション」記載
- [x] design.mdに「シートI/Oの責務」記載

### テスト品質

- [ ] 単体テストが主要ロジックをカバー
  - [ ] テンプレート展開
  - [ ] 日付計算
  - [ ] メモ抽出
  - [ ] ガント生成データ
- [ ] 結合テストでガント生成フロー検証
  - [ ] シート読み取り
  - [ ] ガントシート作成
  - [ ] 見た目（固定、色、日付ヘッダ）

### CI/CD

- [ ] lint/format/build/testがCI上で実行可能

---

## 課題・メモ

### 検討事項

1. **タイムゾーン処理**: スプレッドシートのタイムゾーン取得方法の確認が必要
2. **大量データ対応**: 1000件超の場合の性能検証は将来課題
3. **Backlog連携**: 抽象化ポイントは設計済み、将来実装

### リスク

1. **GASの実行時間制限**: 6分制限に注意
2. **同時編集**: 競合制御なしのため、運用で対応

### 決定事項

1. 結合テスト戦略: モックSpreadsheetを採用（理由: CI/CD統合、高速実行）
2. 設定保存先: 可視化設定シートを採用（理由: ユーザー編集可能）
3. チケットID形式: T-XXX（3桁以上、ゼロパディング）

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-02-03 | 初版作成、Phase 1のドキュメント作成完了 |
| 2026-02-03 | Phase 2（セットアップ）、Phase 3（基盤）、Phase 4（ユーティリティ）、Phase 5（HTML/main.ts スケルトン）完了 |
