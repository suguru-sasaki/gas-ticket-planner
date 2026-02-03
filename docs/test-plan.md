# テスト計画書 (test-plan.md)

## 1. テスト戦略概要

### 1.1 テストレベル

| レベル | 対象 | 目的 | 実行環境 |
|-------|------|------|---------|
| 単体テスト | ドメインロジック、ユーティリティ | 個々の関数の正確性検証 | ローカル（Node.js） |
| 結合テスト | サービス層 + リポジトリ層 | モジュール間連携の検証 | ローカル（モック使用） |
| E2Eテスト | 全体フロー | 実際のスプレッドシートでの動作確認 | GAS環境（手動） |

### 1.2 テスト方針

1. **ローカルテスト優先**: clasp push前にローカルでテストを実行
2. **モック活用**: SpreadsheetAppをモックし、GAS依存なしでテスト可能に
3. **カバレッジ目標**: ドメインロジック80%以上、ユーティリティ100%
4. **CI/CD統合**: GitHub Actionsでpush時にテスト自動実行

### 1.3 使用ツール

| ツール | 用途 | バージョン |
|-------|------|-----------|
| Jest | テストフレームワーク | ^29.x |
| ts-jest | TypeScript対応 | ^29.x |
| @types/jest | 型定義 | ^29.x |
| @types/google-apps-script | GAS型定義 | latest |

---

## 2. 単体テスト

### 2.1 テスト対象一覧

| モジュール | クラス/関数 | 優先度 | カバレッジ目標 |
|-----------|------------|--------|--------------|
| domain/utils | DateUtils | 高 | 100% |
| domain/utils | MemoExtractor | 高 | 100% |
| domain/utils | IdGenerator | 高 | 100% |
| domain/utils | Validator | 高 | 100% |
| domain/services | TemplateService | 高 | 90% |
| domain/services | GanttService (データ生成部分) | 高 | 90% |
| domain/services | TicketService (ビジネスロジック) | 中 | 80% |

### 2.2 DateUtils テストケース

```typescript
// tests/unit/domain/utils/DateUtils.test.ts

describe('DateUtils', () => {
  describe('addDays', () => {
    it('正の日数を加算できる', () => {
      const base = new Date('2024-01-10');
      const result = DateUtils.addDays(base, 5);
      expect(result).toEqual(new Date('2024-01-15'));
    });

    it('負の日数を加算（減算）できる', () => {
      const base = new Date('2024-01-10');
      const result = DateUtils.addDays(base, -3);
      expect(result).toEqual(new Date('2024-01-07'));
    });

    it('月跨ぎを正しく処理できる', () => {
      const base = new Date('2024-01-30');
      const result = DateUtils.addDays(base, 5);
      expect(result).toEqual(new Date('2024-02-04'));
    });

    it('年跨ぎを正しく処理できる', () => {
      const base = new Date('2024-12-30');
      const result = DateUtils.addDays(base, 5);
      expect(result).toEqual(new Date('2025-01-04'));
    });

    it('閏年の2月29日を正しく処理できる', () => {
      const base = new Date('2024-02-28');
      const result = DateUtils.addDays(base, 1);
      expect(result).toEqual(new Date('2024-02-29'));
    });
  });

  describe('daysBetween', () => {
    it('同日の場合は1を返す（開始日を含む）', () => {
      const result = DateUtils.daysBetween(
        new Date('2024-01-10'),
        new Date('2024-01-10')
      );
      expect(result).toBe(1);
    });

    it('連続する2日間は2を返す', () => {
      const result = DateUtils.daysBetween(
        new Date('2024-01-10'),
        new Date('2024-01-11')
      );
      expect(result).toBe(2);
    });

    it('1週間は7を返す', () => {
      const result = DateUtils.daysBetween(
        new Date('2024-01-10'),
        new Date('2024-01-16')
      );
      expect(result).toBe(7);
    });
  });

  describe('generateDateRange', () => {
    it('開始日から終了日までの日付配列を生成する', () => {
      const result = DateUtils.generateDateRange(
        new Date('2024-01-10'),
        new Date('2024-01-12')
      );
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(new Date('2024-01-10'));
      expect(result[1]).toEqual(new Date('2024-01-11'));
      expect(result[2]).toEqual(new Date('2024-01-12'));
    });

    it('同日の場合は1要素の配列を返す', () => {
      const result = DateUtils.generateDateRange(
        new Date('2024-01-10'),
        new Date('2024-01-10')
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getDayOfWeek', () => {
    it('日曜日を正しく返す', () => {
      expect(DateUtils.getDayOfWeek(new Date('2024-01-07'))).toBe('日');
    });

    it('月曜日を正しく返す', () => {
      expect(DateUtils.getDayOfWeek(new Date('2024-01-08'))).toBe('月');
    });

    it('土曜日を正しく返す', () => {
      expect(DateUtils.getDayOfWeek(new Date('2024-01-13'))).toBe('土');
    });
  });

  describe('isWeekend', () => {
    it('土曜日はtrueを返す', () => {
      expect(DateUtils.isWeekend(new Date('2024-01-13'))).toBe(true);
    });

    it('日曜日はtrueを返す', () => {
      expect(DateUtils.isWeekend(new Date('2024-01-14'))).toBe(true);
    });

    it('平日はfalseを返す', () => {
      expect(DateUtils.isWeekend(new Date('2024-01-10'))).toBe(false);
    });
  });

  describe('isOverlapping', () => {
    it('完全に含まれる場合はtrueを返す', () => {
      // 期間1: 1/1-1/31, 期間2: 1/10-1/20
      expect(
        DateUtils.isOverlapping(
          new Date('2024-01-01'), new Date('2024-01-31'),
          new Date('2024-01-10'), new Date('2024-01-20')
        )
      ).toBe(true);
    });

    it('部分的に重なる場合はtrueを返す', () => {
      // 期間1: 1/10-1/20, 期間2: 1/15-1/25
      expect(
        DateUtils.isOverlapping(
          new Date('2024-01-10'), new Date('2024-01-20'),
          new Date('2024-01-15'), new Date('2024-01-25')
        )
      ).toBe(true);
    });

    it('境界で接する場合はtrueを返す', () => {
      // 期間1: 1/10-1/15, 期間2: 1/15-1/20
      expect(
        DateUtils.isOverlapping(
          new Date('2024-01-10'), new Date('2024-01-15'),
          new Date('2024-01-15'), new Date('2024-01-20')
        )
      ).toBe(true);
    });

    it('完全に離れている場合はfalseを返す', () => {
      // 期間1: 1/1-1/10, 期間2: 1/20-1/31
      expect(
        DateUtils.isOverlapping(
          new Date('2024-01-01'), new Date('2024-01-10'),
          new Date('2024-01-20'), new Date('2024-01-31')
        )
      ).toBe(false);
    });
  });

  describe('format', () => {
    it('M/D形式でフォーマットできる', () => {
      expect(DateUtils.format(new Date('2024-01-05'), 'M/D')).toBe('1/5');
    });

    it('YYYY/MM/DD形式でフォーマットできる', () => {
      expect(DateUtils.format(new Date('2024-01-05'), 'YYYY/MM/DD')).toBe('2024/01/05');
    });
  });
});
```

### 2.3 MemoExtractor テストケース

```typescript
// tests/unit/domain/utils/MemoExtractor.test.ts

describe('MemoExtractor', () => {
  describe('extract', () => {
    it('//で始まる行からメモを抽出する', () => {
      const description = '通常のテキスト\n// これはメモです\n続きのテキスト';
      expect(MemoExtractor.extract(description)).toBe('これはメモです');
    });

    it('複数の//行がある場合は最初の1行のみを返す', () => {
      const description = '// 最初のメモ\nテキスト\n// 二番目のメモ';
      expect(MemoExtractor.extract(description)).toBe('最初のメモ');
    });

    it('//行がない場合は空文字を返す', () => {
      const description = '通常のテキストのみ\n改行あり';
      expect(MemoExtractor.extract(description)).toBe('');
    });

    it('空文字の場合は空文字を返す', () => {
      expect(MemoExtractor.extract('')).toBe('');
    });

    it('nullの場合は空文字を返す', () => {
      expect(MemoExtractor.extract(null as any)).toBe('');
    });

    it('undefinedの場合は空文字を返す', () => {
      expect(MemoExtractor.extract(undefined as any)).toBe('');
    });

    it('//の後にスペースがない場合も抽出する', () => {
      const description = '//メモです';
      expect(MemoExtractor.extract(description)).toBe('メモです');
    });

    it('行頭のスペース後に//がある場合も抽出する', () => {
      const description = '  // インデントされたメモ';
      expect(MemoExtractor.extract(description)).toBe('インデントされたメモ');
    });

    it('//のみの行は空文字のメモとして扱う', () => {
      const description = '//\nテキスト';
      expect(MemoExtractor.extract(description)).toBe('');
    });

    it('途中に//を含む行は抽出しない', () => {
      const description = 'URL: https://example.com\nテキスト';
      expect(MemoExtractor.extract(description)).toBe('');
    });
  });
});
```

### 2.4 IdGenerator テストケース

```typescript
// tests/unit/domain/utils/IdGenerator.test.ts

describe('IdGenerator', () => {
  describe('generateTicketId', () => {
    it('空配列の場合はT-001を返す', () => {
      expect(IdGenerator.generateTicketId([])).toBe('T-001');
    });

    it('既存IDの次の番号を返す', () => {
      expect(IdGenerator.generateTicketId(['T-001'])).toBe('T-002');
    });

    it('複数の既存IDがある場合は最大値の次を返す', () => {
      expect(IdGenerator.generateTicketId(['T-001', 'T-005', 'T-003'])).toBe('T-006');
    });

    it('999を超えても正しく採番する', () => {
      expect(IdGenerator.generateTicketId(['T-999'])).toBe('T-1000');
    });

    it('桁数が不揃いでも正しく処理する', () => {
      expect(IdGenerator.generateTicketId(['T-1', 'T-02', 'T-003'])).toBe('T-004');
    });
  });

  describe('extractNumber', () => {
    it('T-001から1を抽出する', () => {
      expect(IdGenerator.extractNumber('T-001')).toBe(1);
    });

    it('T-999から999を抽出する', () => {
      expect(IdGenerator.extractNumber('T-999')).toBe(999);
    });

    it('T-1000から1000を抽出する', () => {
      expect(IdGenerator.extractNumber('T-1000')).toBe(1000);
    });
  });
});
```

### 2.5 Validator テストケース

```typescript
// tests/unit/domain/utils/Validator.test.ts

describe('Validator', () => {
  describe('validateTicketName', () => {
    it('有効な名前は例外を投げない', () => {
      expect(() => Validator.validateTicketName('有効なチケット名')).not.toThrow();
    });

    it('空文字は例外を投げる', () => {
      expect(() => Validator.validateTicketName('')).toThrow(AppError);
    });

    it('スペースのみは例外を投げる', () => {
      expect(() => Validator.validateTicketName('   ')).toThrow(AppError);
    });

    it('100文字を超えると例外を投げる', () => {
      const longName = 'あ'.repeat(101);
      expect(() => Validator.validateTicketName(longName)).toThrow(AppError);
    });

    it('100文字ちょうどは例外を投げない', () => {
      const name = 'あ'.repeat(100);
      expect(() => Validator.validateTicketName(name)).not.toThrow();
    });
  });

  describe('validateDate', () => {
    it('有効な日付文字列をDateに変換する', () => {
      const result = Validator.validateDate('2024-01-10');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
    });

    it('Dateオブジェクトはそのまま返す', () => {
      const date = new Date('2024-01-10');
      const result = Validator.validateDate(date);
      expect(result).toEqual(date);
    });

    it('無効な日付文字列は例外を投げる', () => {
      expect(() => Validator.validateDate('invalid')).toThrow(AppError);
    });
  });

  describe('validateDateRange', () => {
    it('開始日が終了日より前なら例外を投げない', () => {
      expect(() =>
        Validator.validateDateRange(
          new Date('2024-01-10'),
          new Date('2024-01-15')
        )
      ).not.toThrow();
    });

    it('開始日と終了日が同じなら例外を投げない', () => {
      expect(() =>
        Validator.validateDateRange(
          new Date('2024-01-10'),
          new Date('2024-01-10')
        )
      ).not.toThrow();
    });

    it('開始日が終了日より後なら例外を投げる', () => {
      expect(() =>
        Validator.validateDateRange(
          new Date('2024-01-15'),
          new Date('2024-01-10')
        )
      ).toThrow(AppError);
    });
  });

  describe('validateColorCode', () => {
    it('有効なHEXコードは例外を投げない', () => {
      expect(() => Validator.validateColorCode('#FF5733')).not.toThrow();
    });

    it('小文字のHEXコードも有効', () => {
      expect(() => Validator.validateColorCode('#ff5733')).not.toThrow();
    });

    it('#なしは例外を投げる', () => {
      expect(() => Validator.validateColorCode('FF5733')).toThrow(AppError);
    });

    it('桁数が不足すると例外を投げる', () => {
      expect(() => Validator.validateColorCode('#FFF')).toThrow(AppError);
    });

    it('無効な文字を含むと例外を投げる', () => {
      expect(() => Validator.validateColorCode('#GGGGGG')).toThrow(AppError);
    });
  });
});
```

### 2.6 TemplateService テストケース

```typescript
// tests/unit/domain/services/TemplateService.test.ts

describe('TemplateService', () => {
  describe('expandTemplates', () => {
    const templates: Template[] = [
      { name: '設計', description: '設計作業', startOffset: 0, duration: 3 },
      { name: '実装', description: '実装作業', startOffset: 3, duration: 5 },
      { name: 'テスト', description: 'テスト作業\n// 要確認', startOffset: 8, duration: 2 },
    ];

    it('テンプレートから子チケットを展開できる', () => {
      const parentStartDate = new Date('2024-01-10');
      const parentId = 'T-001';
      const assignee = '山田太郎';

      const result = TemplateService.expandTemplates(
        templates,
        parentId,
        parentStartDate,
        assignee
      );

      expect(result).toHaveLength(3);
    });

    it('開始日オフセットが正しく適用される', () => {
      const parentStartDate = new Date('2024-01-10');
      const result = TemplateService.expandTemplates(
        templates,
        'T-001',
        parentStartDate,
        '山田太郎'
      );

      // 設計: 1/10開始（オフセット0）
      expect(result[0].startDate).toEqual(new Date('2024-01-10'));
      // 実装: 1/13開始（オフセット3）
      expect(result[1].startDate).toEqual(new Date('2024-01-13'));
      // テスト: 1/18開始（オフセット8）
      expect(result[2].startDate).toEqual(new Date('2024-01-18'));
    });

    it('期間が正しく計算される', () => {
      const parentStartDate = new Date('2024-01-10');
      const result = TemplateService.expandTemplates(
        templates,
        'T-001',
        parentStartDate,
        '山田太郎'
      );

      // 設計: 1/10-1/12（3日間）
      expect(result[0].endDate).toEqual(new Date('2024-01-12'));
      // 実装: 1/13-1/17（5日間）
      expect(result[1].endDate).toEqual(new Date('2024-01-17'));
      // テスト: 1/18-1/19（2日間）
      expect(result[2].endDate).toEqual(new Date('2024-01-19'));
    });

    it('空のテンプレート配列は空配列を返す', () => {
      const result = TemplateService.expandTemplates(
        [],
        'T-001',
        new Date('2024-01-10'),
        '山田太郎'
      );

      expect(result).toHaveLength(0);
    });

    it('各子チケットに親IDが設定される', () => {
      const result = TemplateService.expandTemplates(
        templates,
        'T-001',
        new Date('2024-01-10'),
        '山田太郎'
      );

      result.forEach(ticket => {
        expect(ticket.parentId).toBe('T-001');
        expect(ticket.type).toBe('child');
      });
    });

    it('初期状態は未着手になる', () => {
      const result = TemplateService.expandTemplates(
        templates,
        'T-001',
        new Date('2024-01-10'),
        '山田太郎'
      );

      result.forEach(ticket => {
        expect(ticket.status).toBe('notStarted');
      });
    });
  });
});
```

### 2.7 GanttService テストケース（データ生成部分）

```typescript
// tests/unit/domain/services/GanttService.test.ts

describe('GanttService', () => {
  describe('generateColorMatrix', () => {
    const defaultSettings: GanttSettings = {
      parentColor: '#4285F4',
      childColorNotStarted: '#E0E0E0',
      childColorInProgress: '#FFC107',
      childColorCompleted: '#4CAF50',
      todayColor: '#FFEB3B',
      weekendColor: '#F5F5F5',
      headerBackgroundColor: '#E3F2FD',
    };

    it('チケット期間内のセルに色が設定される', () => {
      const rows: GanttRow[] = [
        {
          parentName: '親1',
          childName: '',
          memo: '',
          assignee: '山田',
          status: '未着手',
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-12'),
          isParent: true,
          ticket: { status: 'notStarted' } as Ticket,
        },
      ];

      const headers: GanttHeader[] = [
        { date: new Date('2024-01-09'), label: '1/9', isWeekend: false, isToday: false },
        { date: new Date('2024-01-10'), label: '1/10', isWeekend: false, isToday: false },
        { date: new Date('2024-01-11'), label: '1/11', isWeekend: false, isToday: false },
        { date: new Date('2024-01-12'), label: '1/12', isWeekend: false, isToday: false },
        { date: new Date('2024-01-13'), label: '1/13', isWeekend: false, isToday: false },
      ];

      const result = GanttService.generateColorMatrix(rows, headers, defaultSettings);

      expect(result[0][0]).toBe(''); // 1/9: 期間外
      expect(result[0][1]).toBe('#4285F4'); // 1/10: 期間内（親チケット色）
      expect(result[0][2]).toBe('#4285F4'); // 1/11: 期間内
      expect(result[0][3]).toBe('#4285F4'); // 1/12: 期間内
      expect(result[0][4]).toBe(''); // 1/13: 期間外
    });

    it('子チケットは状態に応じた色が設定される', () => {
      const createRow = (status: TicketStatus): GanttRow => ({
        parentName: '親1',
        childName: '子1',
        memo: '',
        assignee: '山田',
        status: STATUS_LABELS[status],
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-10'),
        isParent: false,
        ticket: { status } as Ticket,
      });

      const headers: GanttHeader[] = [
        { date: new Date('2024-01-10'), label: '1/10', isWeekend: false, isToday: false },
      ];

      // 未着手
      const notStarted = GanttService.generateColorMatrix(
        [createRow('notStarted')], headers, defaultSettings
      );
      expect(notStarted[0][0]).toBe('#E0E0E0');

      // 進行中
      const inProgress = GanttService.generateColorMatrix(
        [createRow('inProgress')], headers, defaultSettings
      );
      expect(inProgress[0][0]).toBe('#FFC107');

      // 完了
      const completed = GanttService.generateColorMatrix(
        [createRow('completed')], headers, defaultSettings
      );
      expect(completed[0][0]).toBe('#4CAF50');
    });
  });

  describe('filterTicketsByPeriod', () => {
    const tickets: Ticket[] = [
      { id: 'T-001', type: 'parent', startDate: new Date('2024-01-01'), endDate: new Date('2024-01-10') } as Ticket,
      { id: 'T-002', type: 'parent', startDate: new Date('2024-01-15'), endDate: new Date('2024-01-20') } as Ticket,
      { id: 'T-003', type: 'parent', startDate: new Date('2024-01-25'), endDate: new Date('2024-01-31') } as Ticket,
    ];

    it('期間に完全に含まれるチケットを抽出する', () => {
      const result = GanttService.filterTicketsByPeriod(
        tickets,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      expect(result).toHaveLength(3);
    });

    it('期間と部分的に重なるチケットを抽出する', () => {
      const result = GanttService.filterTicketsByPeriod(
        tickets,
        new Date('2024-01-05'),
        new Date('2024-01-18')
      );
      // T-001: 1/1-1/10 → 重なる
      // T-002: 1/15-1/20 → 重なる
      // T-003: 1/25-1/31 → 重ならない
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toEqual(['T-001', 'T-002']);
    });

    it('期間と重ならないチケットは除外する', () => {
      const result = GanttService.filterTicketsByPeriod(
        tickets,
        new Date('2024-02-01'),
        new Date('2024-02-28')
      );
      expect(result).toHaveLength(0);
    });

    it('境界で接するチケットは含める', () => {
      const result = GanttService.filterTicketsByPeriod(
        tickets,
        new Date('2024-01-10'),
        new Date('2024-01-15')
      );
      // T-001: 終了日が1/10 → 含む
      // T-002: 開始日が1/15 → 含む
      expect(result).toHaveLength(2);
    });
  });

  describe('calculateDateRange', () => {
    it('複数チケットの最小開始日と最大終了日を返す', () => {
      const rows: GanttRow[] = [
        { startDate: new Date('2024-01-10'), endDate: new Date('2024-01-15') } as GanttRow,
        { startDate: new Date('2024-01-05'), endDate: new Date('2024-01-12') } as GanttRow,
        { startDate: new Date('2024-01-08'), endDate: new Date('2024-01-20') } as GanttRow,
      ];

      const result = GanttService.calculateDateRange(rows);

      expect(result.start).toEqual(new Date('2024-01-05'));
      expect(result.end).toEqual(new Date('2024-01-20'));
    });

    it('単一チケットの場合はそのチケットの範囲を返す', () => {
      const rows: GanttRow[] = [
        { startDate: new Date('2024-01-10'), endDate: new Date('2024-01-15') } as GanttRow,
      ];

      const result = GanttService.calculateDateRange(rows);

      expect(result.start).toEqual(new Date('2024-01-10'));
      expect(result.end).toEqual(new Date('2024-01-15'));
    });
  });
});
```

---

## 3. 結合テスト

### 3.1 結合テスト戦略

#### 選択肢の比較

| 戦略 | メリット | デメリット |
|-----|---------|-----------|
| **モックSpreadsheet** | 高速実行、CI/CD統合可能、環境非依存 | 実際のGAS挙動と差異の可能性 |
| **専用テストスプレッドシート** | 実環境での動作確認 | 実行速度が遅い、認証が必要、並列実行不可 |

#### 選定結果

**モックSpreadsheetを採用**

**理由**:
1. ローカルでのCI/CD統合が容易
2. 高速なフィードバックサイクル
3. 並列テスト実行が可能
4. GAS固有の挙動は最終的なE2Eテスト（手動）で確認

### 3.2 結合テスト対象

| テストケース | 対象モジュール | 検証内容 |
|-------------|--------------|---------|
| チケット作成フロー | TicketService + Repository | テンプレート展開 → 保存 |
| ガント生成フロー | GanttService + Repository | 読み取り → データ生成 → シート作成 |
| 設定読み込み | SettingsRepository | シートから設定を正しく読み込み |

### 3.3 モックインフラストラクチャ

```typescript
// tests/helpers/MockSpreadsheet.ts

export class MockSpreadsheetWrapper implements ISpreadsheetWrapper {
  private sheets: Map<string, MockSheet> = new Map();
  private createdSheets: string[] = [];
  private timezone = 'Asia/Tokyo';

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
    this.createdSheets.push(name);
    return sheet;
  }

  getCreatedSheets(): string[] {
    return this.createdSheets;
  }

  getSheetData(name: string): any[][] {
    const sheet = this.sheets.get(name);
    return sheet ? (sheet as MockSheet).getAllData() : [];
  }

  getTimezone(): string {
    return this.timezone;
  }

  setTimezone(tz: string): void {
    this.timezone = tz;
  }
}

export class MockSheet implements ISheet {
  private data: any[][];
  private backgrounds: string[][] = [];
  private frozenRows = 0;
  private frozenCols = 0;

  constructor(private name: string, initialData: any[][]) {
    this.data = JSON.parse(JSON.stringify(initialData));
  }

  getName(): string {
    return this.name;
  }

  getLastRow(): number {
    return this.data.length;
  }

  getLastColumn(): number {
    return this.data.reduce((max, row) => Math.max(max, row.length), 0);
  }

  getRange(row: number, col: number, numRows = 1, numCols = 1): IRange {
    return new MockRange(this, row - 1, col - 1, numRows, numCols);
  }

  setFrozenRows(rows: number): void {
    this.frozenRows = rows;
  }

  setFrozenColumns(cols: number): void {
    this.frozenCols = cols;
  }

  getFrozenRows(): number {
    return this.frozenRows;
  }

  getFrozenColumns(): number {
    return this.frozenCols;
  }

  getAllData(): any[][] {
    return this.data;
  }

  getAllBackgrounds(): string[][] {
    return this.backgrounds;
  }

  // 内部用
  _setData(startRow: number, startCol: number, values: any[][]): void {
    for (let r = 0; r < values.length; r++) {
      if (!this.data[startRow + r]) {
        this.data[startRow + r] = [];
      }
      for (let c = 0; c < values[r].length; c++) {
        this.data[startRow + r][startCol + c] = values[r][c];
      }
    }
  }

  _setBackgrounds(startRow: number, startCol: number, colors: string[][]): void {
    for (let r = 0; r < colors.length; r++) {
      if (!this.backgrounds[startRow + r]) {
        this.backgrounds[startRow + r] = [];
      }
      for (let c = 0; c < colors[r].length; c++) {
        this.backgrounds[startRow + r][startCol + c] = colors[r][c];
      }
    }
  }
}
```

### 3.4 ガント生成結合テスト

```typescript
// tests/integration/GanttGeneration.test.ts

describe('ガント生成結合テスト', () => {
  let mockSpreadsheet: MockSpreadsheetWrapper;
  let ganttService: GanttService;
  let ticketService: TicketService;

  beforeEach(() => {
    mockSpreadsheet = new MockSpreadsheetWrapper();

    // チケット管理シートのモックデータ
    mockSpreadsheet.addSheet('チケット管理', [
      ['チケットID', '親チケットID', 'チケット種別', 'チケット名', '説明文', '担当者', '状態', '開始日', '終了日', '作成日時'],
      ['T-001', '', '親', '機能A開発', '機能Aの開発\n// 優先度高', '山田太郎', '進行中', new Date('2024-01-10'), new Date('2024-01-20'), new Date('2024-01-09')],
      ['T-002', 'T-001', '子', '設計', '設計作業', '山田太郎', '完了', new Date('2024-01-10'), new Date('2024-01-12'), new Date('2024-01-09')],
      ['T-003', 'T-001', '子', '実装', '実装作業', '山田太郎', '進行中', new Date('2024-01-13'), new Date('2024-01-18'), new Date('2024-01-09')],
      ['T-004', 'T-001', '子', 'テスト', 'テスト作業', '山田太郎', '未着手', new Date('2024-01-19'), new Date('2024-01-20'), new Date('2024-01-09')],
    ]);

    // 可視化設定シートのモックデータ
    mockSpreadsheet.addSheet('可視化設定', [
      ['設定項目', '設定値'],
      ['親チケット色', '#4285F4'],
      ['子チケット色_未着手', '#E0E0E0'],
      ['子チケット色_進行中', '#FFC107'],
      ['子チケット色_完了', '#4CAF50'],
      ['今日の日付色', '#FFEB3B'],
      ['週末色', '#F5F5F5'],
      ['ヘッダ背景色', '#E3F2FD'],
    ]);

    // サービスの初期化
    const ticketRepo = new TicketRepository(mockSpreadsheet);
    const settingsRepo = new SettingsRepository(mockSpreadsheet);
    ticketService = new TicketService(mockSpreadsheet, ticketRepo);
    ganttService = new GanttService(ticketService, settingsRepo, mockSpreadsheet);
  });

  describe('ガントシート生成', () => {
    it('指定期間のチケットでガントシートを生成できる', () => {
      const sheetName = ganttService.createGanttSheet(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      // シートが作成されたことを確認
      expect(sheetName).toMatch(/^ガント_\d{8}_\d{6}$/);
      expect(mockSpreadsheet.getCreatedSheets()).toContain(sheetName);
    });

    it('ヘッダ行が正しく設定される', () => {
      const sheetName = ganttService.createGanttSheet(
        new Date('2024-01-10'),
        new Date('2024-01-20')
      );

      const data = mockSpreadsheet.getSheetData(sheetName);
      const header = data[0];

      // 固定列のヘッダ
      expect(header[0]).toBe('親チケット名');
      expect(header[1]).toBe('子チケット名');
      expect(header[2]).toBe('メモ');
      expect(header[3]).toBe('担当者');
      expect(header[4]).toBe('状態');
      expect(header[5]).toBe('開始日');
      expect(header[6]).toBe('終了日');

      // 日付ヘッダ（1/10から開始）
      expect(header[7]).toContain('1/10');
    });

    it('チケットデータが正しく展開される', () => {
      const sheetName = ganttService.createGanttSheet(
        new Date('2024-01-10'),
        new Date('2024-01-20')
      );

      const data = mockSpreadsheet.getSheetData(sheetName);

      // 親チケット行
      expect(data[1][0]).toBe('機能A開発'); // 親チケット名
      expect(data[1][1]).toBe(''); // 子チケット名（親なので空）
      expect(data[1][2]).toBe('優先度高'); // メモ

      // 子チケット行
      expect(data[2][0]).toBe('機能A開発'); // 親チケット名
      expect(data[2][1]).toBe('設計'); // 子チケット名
    });

    it('列固定と行固定が正しく設定される', () => {
      const sheetName = ganttService.createGanttSheet(
        new Date('2024-01-10'),
        new Date('2024-01-20')
      );

      const sheet = mockSpreadsheet.getSheetByName(sheetName) as MockSheet;

      expect(sheet.getFrozenRows()).toBe(1); // ヘッダ行を固定
      expect(sheet.getFrozenColumns()).toBe(7); // 終了日列まで固定
    });

    it('ガントの色が正しく設定される', () => {
      const sheetName = ganttService.createGanttSheet(
        new Date('2024-01-10'),
        new Date('2024-01-20')
      );

      const sheet = mockSpreadsheet.getSheetByName(sheetName) as MockSheet;
      const backgrounds = sheet.getAllBackgrounds();

      // 親チケット（1/10-1/20）の1/10のセル
      // 行1（0-indexed）、列7（日付列開始、0-indexed）
      expect(backgrounds[1][7]).toBe('#4285F4');

      // 子チケット（設計、完了、1/10-1/12）の1/10のセル
      expect(backgrounds[2][7]).toBe('#4CAF50');
    });

    it('対象チケットがない場合はエラーを投げる', () => {
      expect(() =>
        ganttService.createGanttSheet(
          new Date('2025-01-01'),
          new Date('2025-01-31')
        )
      ).toThrow(AppError);
    });
  });
});
```

### 3.5 チケット作成結合テスト

```typescript
// tests/integration/TicketCreation.test.ts

describe('チケット作成結合テスト', () => {
  let mockSpreadsheet: MockSpreadsheetWrapper;
  let ticketService: TicketService;

  beforeEach(() => {
    mockSpreadsheet = new MockSpreadsheetWrapper();

    // 担当者リストシート
    mockSpreadsheet.addSheet('担当者リスト', [
      ['担当者名', 'メールアドレス'],
      ['山田太郎', 'yamada@example.com'],
      ['鈴木花子', 'suzuki@example.com'],
    ]);

    // テンプレートシート
    mockSpreadsheet.addSheet('テンプレート', [
      ['子チケット名', '説明文', '開始日オフセット', '期間（日数）'],
      ['設計', '設計作業', 0, 3],
      ['実装', '実装作業\n// 優先度高', 3, 5],
      ['テスト', 'テスト作業', 8, 2],
    ]);

    // チケット管理シート（空）
    mockSpreadsheet.addSheet('チケット管理', [
      ['チケットID', '親チケットID', 'チケット種別', 'チケット名', '説明文', '担当者', '状態', '開始日', '終了日', '作成日時'],
    ]);

    const ticketRepo = new TicketRepository(mockSpreadsheet);
    const templateRepo = new TemplateRepository(mockSpreadsheet);
    const assigneeRepo = new AssigneeRepository(mockSpreadsheet);
    ticketService = new TicketService(mockSpreadsheet, ticketRepo, templateRepo, assigneeRepo);
  });

  describe('親子チケット作成', () => {
    it('親チケットと子チケットを作成できる', () => {
      const result = ticketService.createParentWithChildren({
        parentName: '機能A開発',
        parentDescription: '機能Aの開発',
        assignee: '山田太郎',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-20'),
      });

      // 親1 + 子3 = 4チケット
      expect(result).toHaveLength(4);

      // 親チケットの検証
      const parent = result.find(t => t.type === 'parent');
      expect(parent).toBeDefined();
      expect(parent!.name).toBe('機能A開発');
      expect(parent!.id).toBe('T-001');

      // 子チケットの検証
      const children = result.filter(t => t.type === 'child');
      expect(children).toHaveLength(3);
      expect(children.every(c => c.parentId === 'T-001')).toBe(true);
    });

    it('チケットがシートに保存される', () => {
      ticketService.createParentWithChildren({
        parentName: '機能A開発',
        parentDescription: '機能Aの開発',
        assignee: '山田太郎',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-20'),
      });

      const data = mockSpreadsheet.getSheetData('チケット管理');

      // ヘッダ + 4チケット = 5行
      expect(data).toHaveLength(5);

      // 親チケットの確認
      expect(data[1][0]).toBe('T-001');
      expect(data[1][2]).toBe('親');
      expect(data[1][3]).toBe('機能A開発');
    });

    it('存在しない担当者でエラーになる', () => {
      expect(() =>
        ticketService.createParentWithChildren({
          parentName: '機能A開発',
          parentDescription: '機能Aの開発',
          assignee: '存在しない担当者',
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-20'),
        })
      ).toThrow(AppError);
    });

    it('子チケットの日付が正しく計算される', () => {
      const result = ticketService.createParentWithChildren({
        parentName: '機能A開発',
        parentDescription: '機能Aの開発',
        assignee: '山田太郎',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-20'),
      });

      const children = result.filter(t => t.type === 'child');
      const designTask = children.find(c => c.name === '設計');
      const implTask = children.find(c => c.name === '実装');
      const testTask = children.find(c => c.name === 'テスト');

      // 設計: 1/10-1/12（オフセット0、期間3日）
      expect(designTask!.startDate).toEqual(new Date('2024-01-10'));
      expect(designTask!.endDate).toEqual(new Date('2024-01-12'));

      // 実装: 1/13-1/17（オフセット3、期間5日）
      expect(implTask!.startDate).toEqual(new Date('2024-01-13'));
      expect(implTask!.endDate).toEqual(new Date('2024-01-17'));

      // テスト: 1/18-1/19（オフセット8、期間2日）
      expect(testTask!.startDate).toEqual(new Date('2024-01-18'));
      expect(testTask!.endDate).toEqual(new Date('2024-01-19'));
    });
  });
});
```

---

## 4. E2Eテスト（手動）

### 4.1 テスト環境

- 専用のテスト用スプレッドシートを使用
- 開発環境（dev）へデプロイして実行

### 4.2 E2Eテストケース一覧

| No | テストケース | 前提条件 | 手順 | 期待結果 |
|----|------------|---------|------|---------|
| E01 | チケット作成（正常系） | 担当者・テンプレートが登録済み | メニュー→チケット作成→フォーム入力→送信 | 親子チケットが作成される |
| E02 | チケット作成（バリデーション） | - | 空のチケット名で送信 | エラーメッセージが表示される |
| E03 | ガント生成（正常系） | チケットが存在する | メニュー→ガント生成→期間入力→生成 | ガントシートが作成される |
| E04 | ガント生成（対象なし） | 指定期間にチケットなし | 期間を入力→生成 | エラーメッセージが表示される |
| E05 | 列・行固定確認 | ガントシートが存在 | スクロール操作 | ヘッダ行と左7列が固定されている |
| E06 | 色設定変更 | 可視化設定シートを編集 | 設定変更→ガント再生成 | 新しい色が反映される |
| E07 | 設定初期化 | 設定が変更済み | メニュー→設定を初期化 | デフォルト値に戻る |
| E08 | メモ抽出確認 | //コメントを含むチケット | ガント生成 | メモ列に正しく表示される |

### 4.3 E2Eテスト実行手順

```
1. 開発環境にデプロイ
   $ npm run push:dev

2. テスト用スプレッドシートを開く
   $ npm run open:dev

3. 各テストケースを手動実行

4. 結果を記録

5. 不具合があれば修正してE01から再テスト
```

---

## 5. テスト実行環境

### 5.1 Jestの設定

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

### 5.2 テストセットアップ

```typescript
// tests/setup.ts

// GAS固有のグローバルオブジェクトのモック
global.SpreadsheetApp = {
  getActiveSpreadsheet: jest.fn(),
  getUi: jest.fn(),
} as any;

global.ScriptApp = {
  getScriptId: jest.fn(),
} as any;

global.Utilities = {
  formatDate: jest.fn((date, tz, format) => {
    // 簡易実装
    return date.toISOString();
  }),
} as any;

// カスタムマッチャー
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      pass,
      message: () => `expected ${received} to be a valid Date`,
    };
  },
});
```

### 5.3 GitHub Actions設定

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run typecheck

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true
```

---

## 6. テスト実行コマンド

```bash
# 全テスト実行
npm test

# ウォッチモード（開発中）
npm run test:watch

# カバレッジレポート付き
npm run test:coverage

# 特定のテストファイル
npm test -- DateUtils.test.ts

# 特定のテストケース
npm test -- -t "正の日数を加算できる"

# 単体テストのみ
npm test -- tests/unit

# 結合テストのみ
npm test -- tests/integration
```

---

## 7. テスト品質指標

### 7.1 カバレッジ目標

| 対象 | Line | Branch | Function |
|-----|------|--------|----------|
| domain/utils | 100% | 95% | 100% |
| domain/services | 90% | 85% | 95% |
| infra/repositories | 80% | 75% | 90% |
| 全体 | 80% | 70% | 80% |

### 7.2 テスト実行時間目標

| テストレベル | 目標時間 |
|------------|---------|
| 単体テスト全体 | < 10秒 |
| 結合テスト全体 | < 30秒 |
| CI全体（lint + type + test） | < 2分 |

### 7.3 テスト保守性指標

- テストコードと本番コードの比率: 0.8〜1.2
- 1テストケースあたりのアサーション数: 1〜5
- テストの独立性: 各テストは他のテストに依存しない
