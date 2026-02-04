# 設計書 (design.md)

## 0. 設計コンセプト

### 0.1 運用形態

本システムは**Backlog連携によるガントチャート可視化**を目的として設計しています。

- **チケット管理**: Backlog上で行う
- **スプレッドシートの役割**: ガントチャート可視化専用
- **テンプレート**: Backlogへのチケット作成時に子チケット構造を定義

---

## 1. アーキテクチャ概要

### 1.1 レイヤー構成

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Menu      │  │  HTML Form  │  │   Dialog    │     │
│  │ (onOpen)    │  │  (create)   │  │  (gantt)    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │               UiController                       │   │
│  │  - handleCreateTicket()                         │   │
│  │  - handleGenerateGantt()                        │   │
│  │  - handleResetSettings()                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     Domain Layer                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  GanttService                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                    Utilities                     │   │
│  │  - DateUtils  - MemoExtractor  - IdGenerator   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Repository                          │   │
│  │  - TemplateRepository (シート)                  │   │
│  │  - SettingsRepository (シート)                  │   │
│  │  - BacklogRepository (Backlog API)              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │       SpreadsheetWrapper / BacklogClient        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 1.2 設計原則

1. **責務分離**: 各層は明確な責務を持ち、層を跨ぐ依存は上から下への一方向のみ
2. **テスト容易性**: SpreadsheetAppへの依存を薄いラッパーで抽象化し、モック可能に
3. **性能最適化**: SpreadsheetのI/Oは各Repositoryでバッチ処理
4. **エラーハンドリング**: ドメイン層でビジネスエラーを定義、上位層で適切に表示

---

## 2. モジュール分割

### 2.1 ディレクトリ構造

```
src/
├── main.ts                    # エントリポイント（onOpen、グローバル関数）
├── domain/
│   ├── models/
│   │   ├── Ticket.ts          # チケットモデル
│   │   ├── Template.ts        # テンプレートモデル
│   │   ├── Assignee.ts        # 担当者モデル
│   │   ├── GanttRow.ts        # ガント行モデル
│   │   └── Settings.ts        # 設定モデル
│   ├── services/
│   │   └── GanttService.ts    # ガント生成ロジック
│   └── utils/
│       ├── DateUtils.ts       # 日付計算ユーティリティ
│       ├── MemoExtractor.ts   # メモ抽出ユーティリティ
│       ├── IdGenerator.ts     # ID採番ユーティリティ
│       └── Validator.ts       # バリデーションユーティリティ
├── infra/
│   ├── SpreadsheetWrapper.ts  # SpreadsheetAppのラッパー（DI用）
│   ├── SheetInitializer.ts    # シート自動初期化
│   ├── SheetNames.ts          # シート名定数
│   ├── repositories/
│   │   ├── TemplateRepository.ts
│   │   └── SettingsRepository.ts
│   └── backlog/
│       ├── index.ts           # Backlog関連エクスポート
│       ├── BacklogConfig.ts   # Backlog設定管理
│       ├── BacklogClient.ts   # Backlog APIクライアント
│       └── BacklogRepository.ts # Backlogデータアクセス
├── errors/
│   └── AppError.ts            # アプリケーションエラー定義
└── types/
    └── index.ts               # 共通型定義

html/
├── create-ticket.html         # チケット作成フォーム
├── gantt-dialog.html          # ガント生成ダイアログ
└── backlog-settings.html      # Backlog設定ダイアログ

tests/
├── unit/
│   ├── domain/
│   │   ├── utils/
│   │   │   ├── DateUtils.test.ts
│   │   │   ├── MemoExtractor.test.ts
│   │   │   └── Validator.test.ts
│   │   └── services/
│   │       └── GanttService.test.ts
│   └── infra/
│       └── repositories/
│           ├── TemplateRepository.test.ts
│           └── SettingsRepository.test.ts
└── helpers/
    └── MockSpreadsheet.ts     # テスト用モックスプレッドシート
```

### 2.2 各モジュールの責務

#### Presentation Layer

| モジュール | 責務 |
|-----------|------|
| MenuController | onOpenでメニュー登録、メニュークリックのディスパッチ |
| UiController | HTMLフォームからの呼び出しを受け、Serviceを呼び出し結果を返す |
| DialogService | ダイアログ/トースト表示の抽象化 |

#### Domain Layer

| モジュール | 責務 |
|-----------|------|
| GanttService | ガント用データ生成（色、行列構成） |
| DateUtils | 日付計算（相対日、範囲生成、曜日判定） |
| MemoExtractor | 説明文からのメモ抽出 |
| IdGenerator | チケットID採番 |
| Validator | 入力バリデーション |

#### Infrastructure Layer

| モジュール | 責務 |
|-----------|------|
| SpreadsheetWrapper | SpreadsheetAppの薄いラッパー（テスト時モック差し替え用） |
| TemplateRepository | テンプレートシートの読み取り |
| SettingsRepository | 可視化設定シートの読み書き |
| BacklogClient | Backlog REST APIクライアント |
| BacklogRepository | Backlogデータアクセス（チケット取得・作成） |

---

## 3. データモデル

### 3.1 Ticket

```typescript
interface Ticket {
  id: string;                // チケットID (T-001)
  parentId: string | null;   // 親チケットID (子の場合)
  type: 'parent' | 'child';  // チケット種別
  name: string;              // チケット名
  description: string;       // 説明文
  assignee: string;          // 担当者名
  status: TicketStatus;      // 状態
  startDate: Date;           // 開始日
  endDate: Date;             // 終了日
  createdAt: Date;           // 作成日時
}

type TicketStatus = 'notStarted' | 'inProgress' | 'completed';

// 日本語表示用マッピング
const STATUS_LABELS: Record<TicketStatus, string> = {
  notStarted: '未着手',
  inProgress: '進行中',
  completed: '完了',
};
```

### 3.2 Template

```typescript
interface Template {
  name: string;              // 子チケット名
  description: string;       // 説明文
  startOffset: number;       // 開始日オフセット（親開始日からの日数）
  duration: number;          // 期間（日数）
}
```

### 3.3 Assignee

```typescript
interface Assignee {
  name: string;              // 担当者名
  email: string;             // メールアドレス
}
```

### 3.4 GanttRow

```typescript
interface GanttRow {
  parentName: string;        // 親チケット名
  childName: string;         // 子チケット名（親の場合は空）
  memo: string;              // メモ（説明文から抽出）
  assignee: string;          // 担当者
  status: string;            // 状態（日本語）
  startDate: Date;           // 開始日
  endDate: Date;             // 終了日
  isParent: boolean;         // 親チケットかどうか
  ticket: Ticket;            // 元チケット（色決定用）
}
```

### 3.5 GanttData

```typescript
interface GanttData {
  rows: GanttRow[];          // ガント行データ
  dateRange: DateRange;      // 表示日付範囲
  headers: GanttHeader[];    // ヘッダ情報
}

interface DateRange {
  start: Date;               // 開始日
  end: Date;                 // 終了日
}

interface GanttHeader {
  date: Date;                // 日付
  label: string;             // 表示ラベル (M/D (曜))
  isWeekend: boolean;        // 週末フラグ
  isToday: boolean;          // 本日フラグ
}
```

### 3.6 Settings

```typescript
interface GanttSettings {
  parentColor: string;           // 親チケット色
  childColorNotStarted: string;  // 子チケット色（未着手）
  childColorInProgress: string;  // 子チケット色（進行中）
  childColorCompleted: string;   // 子チケット色（完了）
  saturdayColor: string;         // 土曜日色（青系）
  sundayColor: string;           // 日曜日色（赤系）
  holidayColor: string;          // 祝日色（赤系）
  headerBackgroundColor: string; // ヘッダ背景色
}

const DEFAULT_SETTINGS: GanttSettings = {
  parentColor: '#4285F4',
  childColorNotStarted: '#E0E0E0',
  childColorInProgress: '#FFC107',
  childColorCompleted: '#4CAF50',
  saturdayColor: '#BBDEFB',      // 青系（Material Design Blue 100）
  sundayColor: '#FFCDD2',        // 赤系（Material Design Red 100）
  holidayColor: '#FFCDD2',       // 赤系（日曜日と同じ）
  headerBackgroundColor: '#E3F2FD',
};
```

### 3.7 祝日取得

```typescript
/**
 * 祝日サービス
 * Google Calendar APIを使用して日本の祝日を取得
 */
class HolidayService {
  private static readonly CALENDAR_ID = 'ja.japanese#holiday@group.v.calendar.google.com';

  /**
   * 指定期間内の祝日を取得
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 祝日の日付配列
   */
  static getHolidays(startDate: Date, endDate: Date): Date[];

  /**
   * 指定日が祝日かどうかを判定
   * @param date 判定対象日
   * @param holidays 祝日リスト
   * @returns 祝日ならtrue
   */
  static isHoliday(date: Date, holidays: Date[]): boolean;
}
```

---

## 4. 主要関数設計

### 4.1 DateUtils

```typescript
class DateUtils {
  /**
   * 基準日に日数を加算
   * @param baseDate 基準日
   * @param days 加算日数（負も可）
   * @returns 加算後の日付
   */
  static addDays(baseDate: Date, days: number): Date;

  /**
   * 2つの日付間の日数を計算
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 日数（開始日を含む）
   */
  static daysBetween(startDate: Date, endDate: Date): number;

  /**
   * 開始日から終了日までの日付配列を生成
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 日付の配列
   */
  static generateDateRange(startDate: Date, endDate: Date): Date[];

  /**
   * 曜日を取得
   * @param date 日付
   * @returns 曜日文字（日/月/火/水/木/金/土）
   */
  static getDayOfWeek(date: Date): string;

  /**
   * 週末かどうかを判定
   * @param date 日付
   * @returns 週末ならtrue
   */
  static isWeekend(date: Date): boolean;

  /**
   * 本日かどうかを判定（スプレッドシートのタイムゾーン考慮）
   * @param date 日付
   * @param timezone タイムゾーン
   * @returns 本日ならtrue
   */
  static isToday(date: Date, timezone: string): boolean;

  /**
   * 日付をフォーマット
   * @param date 日付
   * @param format フォーマット文字列
   * @returns フォーマット済み文字列
   */
  static format(date: Date, format: string): string;

  /**
   * 期間が重なるかを判定
   * @param range1Start 期間1開始
   * @param range1End 期間1終了
   * @param range2Start 期間2開始
   * @param range2End 期間2終了
   * @returns 重なりがあればtrue
   */
  static isOverlapping(
    range1Start: Date,
    range1End: Date,
    range2Start: Date,
    range2End: Date
  ): boolean;
}
```

### 4.2 MemoExtractor

```typescript
class MemoExtractor {
  /**
   * 説明文からメモを抽出
   * // で始まる行の最初の1行を返す
   * @param description 説明文
   * @returns メモ文字列（なければ空文字）
   */
  static extract(description: string): string;
}

// 実装例
static extract(description: string): string {
  if (!description) return '';

  const lines = description.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) {
      // '//' を除去して返す
      return trimmed.substring(2).trim();
    }
  }
  return '';
}
```

### 4.3 IdGenerator

```typescript
class IdGenerator {
  /**
   * 新しいチケットIDを生成
   * @param existingIds 既存のチケットID配列
   * @returns 新しいチケットID (T-XXX)
   */
  static generateTicketId(existingIds: string[]): string;

  /**
   * IDから数値部分を抽出
   * @param id チケットID
   * @returns 数値部分
   */
  static extractNumber(id: string): number;
}

// 実装例
static generateTicketId(existingIds: string[]): string {
  if (existingIds.length === 0) {
    return 'T-001';
  }

  const maxNumber = existingIds
    .map(id => this.extractNumber(id))
    .reduce((max, num) => Math.max(max, num), 0);

  const newNumber = maxNumber + 1;
  return `T-${String(newNumber).padStart(3, '0')}`;
}
```

### 4.4 TicketService

```typescript
class TicketService {
  constructor(
    private ticketRepo: TicketRepository,
    private templateRepo: TemplateRepository,
    private assigneeRepo: AssigneeRepository
  ) {}

  /**
   * 親チケットと子チケットを作成
   * @param params 作成パラメータ
   * @returns 作成されたチケット群
   */
  createParentWithChildren(params: CreateTicketParams): Ticket[];

  /**
   * 指定期間に重なる親チケットを取得
   * @param startDate 期間開始日
   * @param endDate 期間終了日
   * @returns 該当する親チケットとその子チケット
   */
  getTicketsInPeriod(startDate: Date, endDate: Date): Ticket[];
}

interface CreateTicketParams {
  parentName: string;
  parentDescription: string;
  assignee: string;
  startDate: Date;
  endDate: Date;
}
```

### 4.5 GanttService

```typescript
class GanttService {
  constructor(
    private ticketRepo: TicketRepository,
    private settingsRepo: SettingsRepository
  ) {}

  /**
   * ガント生成用のデータを作成
   * 1. フィルタ期間に重なる親チケットを抽出
   * 2. 対象親チケット群のmin(開始日)〜max(終了日)をガント表示範囲とする
   * @param startDate フィルタ開始日
   * @param endDate フィルタ終了日
   * @returns ガントデータ
   */
  generateGanttData(startDate: Date, endDate: Date): GanttData;

  /**
   * ガントシートを作成
   * @param data ガントデータ
   * @returns 作成されたシート名
   */
  createGanttSheet(data: GanttData): string;

  /**
   * セル背景色の2次元配列を生成
   * @param rows ガント行データ
   * @param headers ヘッダ情報
   * @param settings 色設定
   * @returns 背景色の2次元配列
   */
  generateColorMatrix(
    rows: GanttRow[],
    headers: GanttHeader[],
    settings: GanttSettings
  ): string[][];
}
```

---

## 5. Spreadsheet I/O 最適化

### 5.1 基本方針

| 操作 | 非推奨パターン | 推奨パターン |
|-----|--------------|-------------|
| 読み取り | ループ内でgetValue() | getValues()で一括取得 |
| 書き込み | ループ内でsetValue() | setValues()で一括書き込み |
| 色設定 | ループ内でsetBackground() | setBackgrounds()で一括設定 |
| 範囲取得 | ループ内でgetRange() | 一度getRange()してオフセット計算 |

### 5.2 Repository実装例

```typescript
class TicketRepository {
  private spreadsheet: SpreadsheetWrapper;
  private sheetName = 'チケット管理';

  /**
   * 全チケットを取得（一括読み取り）
   */
  findAll(): Ticket[] {
    const sheet = this.spreadsheet.getSheetByName(this.sheetName);
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) return []; // ヘッダのみ

    // 一括で全データ取得
    const values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();

    return values.map(row => this.rowToTicket(row));
  }

  /**
   * チケットを一括保存
   */
  saveAll(tickets: Ticket[]): void {
    if (tickets.length === 0) return;

    const sheet = this.spreadsheet.getSheetByName(this.sheetName);
    const lastRow = sheet.getLastRow();

    // 一括で全データ書き込み
    const values = tickets.map(t => this.ticketToRow(t));
    sheet.getRange(lastRow + 1, 1, values.length, 10).setValues(values);
  }

  private rowToTicket(row: any[]): Ticket {
    return {
      id: row[0],
      parentId: row[1] || null,
      type: row[2] === '親' ? 'parent' : 'child',
      name: row[3],
      description: row[4],
      assignee: row[5],
      status: this.parseStatus(row[6]),
      startDate: new Date(row[7]),
      endDate: new Date(row[8]),
      createdAt: new Date(row[9]),
    };
  }

  private ticketToRow(ticket: Ticket): any[] {
    return [
      ticket.id,
      ticket.parentId || '',
      ticket.type === 'parent' ? '親' : '子',
      ticket.name,
      ticket.description,
      ticket.assignee,
      STATUS_LABELS[ticket.status],
      ticket.startDate,
      ticket.endDate,
      ticket.createdAt,
    ];
  }
}
```

### 5.3 ガント生成時の最適化

```typescript
// 非推奨：ループ内で個別設定
for (let row = 0; row < rows.length; row++) {
  for (let col = 0; col < dates.length; col++) {
    sheet.getRange(row + 2, col + 8).setBackground(colors[row][col]); // ❌
  }
}

// 推奨：2次元配列で一括設定
const colorMatrix = this.generateColorMatrix(rows, dates, settings);
sheet.getRange(2, 8, rows.length, dates.length).setBackgrounds(colorMatrix); // ✅
```

---

## 6. HTML ↔ GAS 通信設計

### 6.1 通信パターン

```
[HTML Form]                              [GAS Server]
    │                                        │
    │  google.script.run                     │
    │  .withSuccessHandler(onSuccess)        │
    │  .withFailureHandler(onFailure)        │
    │  .createTicket(formData)               │
    │ ─────────────────────────────────────> │
    │                                        │ UiController.createTicket()
    │                                        │ ↓
    │                                        │ TicketService.createParentWithChildren()
    │                                        │ ↓
    │                                        │ TicketRepository.saveAll()
    │ <───────────────────────────────────── │
    │  Success: { tickets: [...] }           │
    │  or                                    │
    │  Failure: Error object                 │
    │                                        │
```

### 6.2 GAS側のエンドポイント関数

```typescript
// main.ts に定義（グローバルスコープに公開）

/**
 * 担当者リストを取得（HTMLから呼び出し）
 */
function getAssigneeList(): Assignee[] {
  return UiController.getAssigneeList();
}

/**
 * チケットを作成（HTMLから呼び出し）
 */
function createTicket(formData: CreateTicketFormData): CreateTicketResult {
  return UiController.createTicket(formData);
}

/**
 * ガントを生成（HTMLから呼び出し）
 */
function generateGantt(params: GanttParams): GenerateGanttResult {
  return UiController.generateGantt(params);
}

// 型定義
interface CreateTicketFormData {
  parentName: string;
  parentDescription: string;
  assignee: string;
  startDate: string;  // ISO形式
  endDate: string;    // ISO形式
}

interface CreateTicketResult {
  success: boolean;
  tickets?: Ticket[];
  error?: string;
}

interface GanttParams {
  startDate: string;  // ISO形式
  endDate: string;    // ISO形式
}

interface GenerateGanttResult {
  success: boolean;
  sheetName?: string;
  error?: string;
}
```

### 6.3 HTML側の実装例

```html
<script>
  function submitForm() {
    const formData = {
      parentName: document.getElementById('parentName').value,
      parentDescription: document.getElementById('parentDescription').value,
      assignee: document.getElementById('assignee').value,
      startDate: document.getElementById('startDate').value,
      endDate: document.getElementById('endDate').value,
    };

    // バリデーション
    const error = validateForm(formData);
    if (error) {
      showError(error);
      return;
    }

    // 送信中表示
    setLoading(true);

    google.script.run
      .withSuccessHandler(onSuccess)
      .withFailureHandler(onFailure)
      .createTicket(formData);
  }

  function onSuccess(result) {
    setLoading(false);
    if (result.success) {
      alert('チケットを作成しました');
      google.script.host.close();
    } else {
      showError(result.error);
    }
  }

  function onFailure(error) {
    setLoading(false);
    showError('エラーが発生しました: ' + error.message);
  }
</script>
```

---

## 7. 設定の読み込み

### 7.1 設定の保存先

| 設定種別 | 保存先 | 理由 |
|---------|-------|------|
| ガント表示設定 | 可視化設定シート | ユーザーが編集可能にするため |
| シート名定数 | コード内定数 | 変更不可のため |
| 環境別設定 | .clasp.*.json | デプロイ先の分離のため |

### 7.2 SettingsRepository

```typescript
class SettingsRepository {
  private spreadsheet: SpreadsheetWrapper;
  private sheetName = '可視化設定';

  /**
   * 設定を取得
   */
  getSettings(): GanttSettings {
    const sheet = this.spreadsheet.getSheetByName(this.sheetName);
    const values = sheet.getRange(2, 1, 7, 2).getValues();

    const settings: GanttSettings = { ...DEFAULT_SETTINGS };

    for (const [key, value] of values) {
      const settingKey = this.keyToProperty(key);
      if (settingKey && value) {
        settings[settingKey] = value;
      }
    }

    return settings;
  }

  /**
   * 設定をデフォルトに初期化
   */
  resetToDefault(): void {
    const sheet = this.spreadsheet.getSheetByName(this.sheetName);
    const rows = Object.entries(SETTING_KEY_MAP).map(([prop, label]) => [
      label,
      DEFAULT_SETTINGS[prop as keyof GanttSettings],
    ]);

    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }

  private keyToProperty(key: string): keyof GanttSettings | null {
    const map: Record<string, keyof GanttSettings> = {
      '親チケット色': 'parentColor',
      '子チケット色_未着手': 'childColorNotStarted',
      '子チケット色_進行中': 'childColorInProgress',
      '子チケット色_完了': 'childColorCompleted',
      '土曜日色': 'saturdayColor',
      '日曜日色': 'sundayColor',
      '祝日色': 'holidayColor',
      'ヘッダ背景色': 'headerBackgroundColor',
    };
    return map[key] || null;
  }
}
```

---

## 8. 環境分離（dev/prod）

### 8.1 ファイル構成

```
project-root/
├── .clasp.json          # 現在アクティブな環境（gitignore推奨）
├── .clasp.dev.json      # 開発環境設定
├── .clasp.prod.json     # 本番環境設定
├── environments/
│   ├── dev.env          # 開発環境変数
│   └── prod.env         # 本番環境変数
└── scripts/
    ├── switch-env.sh    # 環境切り替えスクリプト
    └── deploy.sh        # デプロイスクリプト
```

### 8.2 clasp設定ファイル

```json
// .clasp.dev.json
{
  "scriptId": "DEV_SCRIPT_ID_HERE",
  "rootDir": "./dist",
  "fileExtension": "ts"
}

// .clasp.prod.json
{
  "scriptId": "PROD_SCRIPT_ID_HERE",
  "rootDir": "./dist",
  "fileExtension": "ts"
}
```

### 8.3 npm scripts

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write src/**/*.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",

    "env:dev": "cp .clasp.dev.json .clasp.json",
    "env:prod": "cp .clasp.prod.json .clasp.json",

    "push:dev": "npm run env:dev && npm run build && clasp push",
    "push:prod": "npm run env:prod && npm run build && clasp push",

    "open:dev": "npm run env:dev && clasp open",
    "open:prod": "npm run env:prod && clasp open"
  }
}
```

### 8.4 環境別の挙動

開発環境と本番環境で異なる動作が必要な場合は、スプレッドシート側で判定する。

```typescript
// 環境判定（スクリプトIDで判定）
function getEnvironment(): 'dev' | 'prod' {
  const scriptId = ScriptApp.getScriptId();
  const devScriptId = 'DEV_SCRIPT_ID_HERE';
  return scriptId === devScriptId ? 'dev' : 'prod';
}
```

---

## 9. テスト容易性のためのDI設計

### 9.1 SpreadsheetWrapper

```typescript
// インターフェース定義
interface ISpreadsheetWrapper {
  getActiveSpreadsheet(): ISpreadsheet;
  getSheetByName(name: string): ISheet;
  createSheet(name: string): ISheet;
  getTimezone(): string;
}

interface ISpreadsheet {
  getSheetByName(name: string): ISheet | null;
  insertSheet(name: string): ISheet;
  toast(message: string, title?: string, timeout?: number): void;
}

interface ISheet {
  getName(): string;
  getLastRow(): number;
  getLastColumn(): number;
  getRange(row: number, col: number, numRows?: number, numCols?: number): IRange;
  setFrozenRows(rows: number): void;
  setFrozenColumns(cols: number): void;
}

interface IRange {
  getValue(): any;
  getValues(): any[][];
  setValue(value: any): void;
  setValues(values: any[][]): void;
  setBackground(color: string): void;
  setBackgrounds(colors: string[][]): void;
  setNumberFormat(format: string): void;
}
```

### 9.2 本番実装

```typescript
class SpreadsheetWrapperImpl implements ISpreadsheetWrapper {
  private spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

  constructor() {
    this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  getActiveSpreadsheet(): ISpreadsheet {
    return new SpreadsheetImpl(this.spreadsheet);
  }

  getSheetByName(name: string): ISheet {
    const sheet = this.spreadsheet.getSheetByName(name);
    if (!sheet) {
      throw new AppError('E005', `シート "${name}" が見つかりません`);
    }
    return new SheetImpl(sheet);
  }

  createSheet(name: string): ISheet {
    const sheet = this.spreadsheet.insertSheet(name);
    return new SheetImpl(sheet);
  }

  getTimezone(): string {
    return this.spreadsheet.getSpreadsheetTimeZone();
  }
}
```

### 9.3 テスト用モック

```typescript
class MockSpreadsheetWrapper implements ISpreadsheetWrapper {
  private sheets: Map<string, MockSheet> = new Map();

  addSheet(name: string, data: any[][]): void {
    this.sheets.set(name, new MockSheet(name, data));
  }

  getSheetByName(name: string): ISheet {
    const sheet = this.sheets.get(name);
    if (!sheet) {
      throw new AppError('E005', `シート "${name}" が見つかりません`);
    }
    return sheet;
  }

  createSheet(name: string): ISheet {
    const sheet = new MockSheet(name, []);
    this.sheets.set(name, sheet);
    return sheet;
  }

  getTimezone(): string {
    return 'Asia/Tokyo';
  }
}

class MockSheet implements ISheet {
  private data: any[][];

  constructor(private name: string, initialData: any[][]) {
    this.data = initialData;
  }

  getLastRow(): number {
    return this.data.length;
  }

  getRange(row: number, col: number, numRows = 1, numCols = 1): IRange {
    return new MockRange(this.data, row - 1, col - 1, numRows, numCols);
  }

  // ... その他のメソッド
}
```

### 9.4 依存性注入の適用

```typescript
// サービスクラスはインターフェースに依存
class TicketService {
  constructor(
    private spreadsheet: ISpreadsheetWrapper,
    private ticketRepo: TicketRepository,
    // ...
  ) {}
}

// 本番環境
const spreadsheet = new SpreadsheetWrapperImpl();
const ticketRepo = new TicketRepository(spreadsheet);
const service = new TicketService(spreadsheet, ticketRepo);

// テスト環境
const mockSpreadsheet = new MockSpreadsheetWrapper();
mockSpreadsheet.addSheet('チケット管理', testData);
const mockTicketRepo = new TicketRepository(mockSpreadsheet);
const service = new TicketService(mockSpreadsheet, mockTicketRepo);
```

---

## 10. エラー設計

### 10.1 AppError クラス

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// エラーコード定義
const ERROR_CODES = {
  E001: '担当者リストが空です',
  E002: '指定された担当者が見つかりません',
  E003: '開始日は終了日以前である必要があります',
  E004: '対象となるチケットがありません',
  E005: 'シートの作成に失敗しました',
  E006: 'テンプレートの読み込みに失敗しました',
  E007: '設定値が不正です',
} as const;
```

### 10.2 エラーハンドリングの流れ

```
[Domain Layer]                    [Application Layer]           [Presentation Layer]
      │                                  │                              │
      │ throw new AppError('E002', ...)  │                              │
      │ ────────────────────────────────>│                              │
      │                                  │ catch (error) {              │
      │                                  │   if (error instanceof       │
      │                                  │       AppError) {            │
      │                                  │     return {                 │
      │                                  │       success: false,        │
      │                                  │       error: error.message   │
      │                                  │     };                       │
      │                                  │   }                          │
      │                                  │   // 予期せぬエラー          │
      │                                  │   console.error(error);      │
      │                                  │   return {                   │
      │                                  │     success: false,          │
      │                                  │     error: '予期せぬエラー'  │
      │                                  │   };                         │
      │                                  │ }                            │
      │                                  │ ────────────────────────────>│
      │                                  │                              │ showError(result.error)
```

---

## 11. セキュリティ考慮事項

### 11.1 入力バリデーション

すべての外部入力（HTMLフォーム、シートデータ）は検証する。

```typescript
class Validator {
  static validateTicketName(name: string): void {
    if (!name || name.trim() === '') {
      throw new AppError('E003', 'チケット名は必須です');
    }
    if (name.length > 100) {
      throw new AppError('E003', 'チケット名は100文字以内です');
    }
  }

  static validateDate(date: any): Date {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new AppError('E003', '無効な日付形式です');
    }
    return parsed;
  }

  static validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate > endDate) {
      throw new AppError('E003', '開始日は終了日以前である必要があります');
    }
  }

  static validateColorCode(color: string): void {
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new AppError('E007', '無効な色コードです');
    }
  }
}
```

### 11.2 XSS対策

HTMLテンプレートでのエスケープ処理。

```typescript
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

---

## 12. 将来の拡張ポイント

### 12.1 Backlog連携のための抽象化

```typescript
// チケット作成の抽象化
interface ITicketCreator {
  createTicket(params: CreateTicketParams): Promise<Ticket>;
}

// スプレッドシート実装
class SpreadsheetTicketCreator implements ITicketCreator {
  async createTicket(params: CreateTicketParams): Promise<Ticket> {
    // シートに保存
  }
}

// Backlog実装（将来）
class BacklogTicketCreator implements ITicketCreator {
  async createTicket(params: CreateTicketParams): Promise<Ticket> {
    // Backlog APIを呼び出し
    // シートにも同期
  }
}
```

### 12.2 設定の拡張

新しい設定項目を追加する場合は、以下の手順で行う。

1. `GanttSettings` インターフェースに項目追加
2. `DEFAULT_SETTINGS` にデフォルト値追加
3. `SettingsRepository` のマッピング追加
4. 可視化設定シートに行追加

### 12.3 状態遷移の拡張

状態を追加する場合は、以下の手順で行う。

1. `TicketStatus` 型に状態追加
2. `STATUS_LABELS` にラベル追加
3. `GanttSettings` に色設定追加
4. `GanttService` の色決定ロジック更新
