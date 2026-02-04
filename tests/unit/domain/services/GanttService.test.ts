import { GanttService } from '../../../../src/domain/services/GanttService';
import { TicketRepository } from '../../../../src/infra/repositories/TicketRepository';
import { SettingsRepository } from '../../../../src/infra/repositories/SettingsRepository';
import { MockSpreadsheetWrapper } from '../../../helpers/MockSpreadsheet';

describe('GanttService', () => {
  let mockSpreadsheet: MockSpreadsheetWrapper;
  let ticketRepository: TicketRepository;
  let settingsRepository: SettingsRepository;
  let service: GanttService;

  const setupSheets = (tickets: unknown[][] = [], settings: unknown[][] = []) => {
    mockSpreadsheet.addSheet('チケット管理', [
      [
        'チケットID',
        '親チケットID',
        'チケット種別',
        'チケット名',
        '説明文',
        '担当者',
        '状態',
        '開始日',
        '終了日',
        '作成日時',
      ],
      ...tickets,
    ]);
    mockSpreadsheet.addSheet('可視化設定', [
      ['設定名', '設定値'],
      ...settings,
    ]);

    ticketRepository = new TicketRepository(mockSpreadsheet);
    settingsRepository = new SettingsRepository(mockSpreadsheet);
    service = new GanttService(ticketRepository, settingsRepository);
  };

  beforeEach(() => {
    mockSpreadsheet = new MockSpreadsheetWrapper();
  });

  describe('generateGantt', () => {
    it('ガントチャートデータを生成できる', () => {
      setupSheets(
        [
          [
            'T-001',
            '',
            '親',
            '機能A',
            '// メモ\n説明',
            '山田太郎',
            '未着手',
            new Date('2024-01-10'),
            new Date('2024-01-12'),
            new Date('2024-01-09'),
          ],
          [
            'T-002',
            'T-001',
            '子',
            '設計',
            '// 設計メモ\n詳細',
            '山田太郎',
            '進行中',
            new Date('2024-01-10'),
            new Date('2024-01-11'),
            new Date('2024-01-09'),
          ],
        ],
        [
          ['親チケット色', '#4285F4'],
          ['子チケット色_未着手', '#E0E0E0'],
          ['子チケット色_進行中', '#FFC107'],
          ['子チケット色_完了', '#4CAF50'],
        ]
      );

      const result = service.generateGantt({
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-12'),
      });

      // ヘッダ確認
      expect(result.headers).toHaveLength(10); // 固定7列 + 日付3列
      expect(result.headers[0]).toBe('親チケット名');
      expect(result.headers[7]).toMatch(/1\/10/);
      expect(result.headers[8]).toMatch(/1\/11/);
      expect(result.headers[9]).toMatch(/1\/12/);

      // 行数確認（親1 + 子1）
      expect(result.rows).toHaveLength(2);

      // 親チケット行確認
      expect(result.rows[0].parentName).toBe('機能A');
      expect(result.rows[0].childName).toBe('');
      expect(result.rows[0].memo).toBe('メモ');
      expect(result.rows[0].assignee).toBe('山田太郎');
      expect(result.rows[0].status).toBe('未着手');

      // 子チケット行確認
      expect(result.rows[1].parentName).toBe('機能A');
      expect(result.rows[1].childName).toBe('設計');
      expect(result.rows[1].memo).toBe('設計メモ');
      expect(result.rows[1].status).toBe('進行中');

      // 背景色配列確認
      expect(result.backgrounds).toHaveLength(2);
      expect(result.backgrounds[0]).toHaveLength(10); // 固定7列 + 日付3列
    });

    it('期間外のチケットは含まれない', () => {
      setupSheets(
        [
          [
            'T-001',
            '',
            '親',
            '機能A',
            '',
            '山田太郎',
            '未着手',
            new Date('2024-02-01'),
            new Date('2024-02-10'),
            new Date('2024-01-09'),
          ],
        ],
        []
      );

      const result = service.generateGantt({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(result.rows).toHaveLength(0);
    });

    it('期間と一部重なるチケットは含まれる', () => {
      setupSheets(
        [
          [
            'T-001',
            '',
            '親',
            '機能A',
            '',
            '山田太郎',
            '未着手',
            new Date('2024-01-25'),
            new Date('2024-02-05'),
            new Date('2024-01-09'),
          ],
        ],
        []
      );

      const result = service.generateGantt({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(result.rows).toHaveLength(1);
    });

    it('複数の親チケットと子チケットを正しく展開する', () => {
      setupSheets(
        [
          // 親チケット1
          [
            'T-001',
            '',
            '親',
            '機能A',
            '',
            '山田太郎',
            '未着手',
            new Date('2024-01-10'),
            new Date('2024-01-15'),
            new Date('2024-01-09'),
          ],
          // 親チケット1の子
          [
            'T-002',
            'T-001',
            '子',
            '設計A',
            '',
            '山田太郎',
            '未着手',
            new Date('2024-01-10'),
            new Date('2024-01-12'),
            new Date('2024-01-09'),
          ],
          // 親チケット2
          [
            'T-003',
            '',
            '親',
            '機能B',
            '',
            '鈴木花子',
            '進行中',
            new Date('2024-01-12'),
            new Date('2024-01-18'),
            new Date('2024-01-09'),
          ],
          // 親チケット2の子
          [
            'T-004',
            'T-003',
            '子',
            '設計B',
            '',
            '鈴木花子',
            '進行中',
            new Date('2024-01-12'),
            new Date('2024-01-14'),
            new Date('2024-01-09'),
          ],
        ],
        []
      );

      const result = service.generateGantt({
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-18'),
      });

      // 親2 + 子2 = 4行
      expect(result.rows).toHaveLength(4);

      // 順序確認（親A, 子A, 親B, 子B）
      expect(result.rows[0].parentName).toBe('機能A');
      expect(result.rows[0].childName).toBe('');
      expect(result.rows[1].parentName).toBe('機能A');
      expect(result.rows[1].childName).toBe('設計A');
      expect(result.rows[2].parentName).toBe('機能B');
      expect(result.rows[2].childName).toBe('');
      expect(result.rows[3].parentName).toBe('機能B');
      expect(result.rows[3].childName).toBe('設計B');
    });

    it('日付範囲が正しく生成される', () => {
      setupSheets(
        [
          [
            'T-001',
            '',
            '親',
            '機能A',
            '',
            '山田太郎',
            '未着手',
            new Date('2024-01-10'),
            new Date('2024-01-12'),
            new Date('2024-01-09'),
          ],
        ],
        []
      );

      const result = service.generateGantt({
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-12'),
      });

      expect(result.dateRange).toHaveLength(3);
      expect(result.dateRange[0].getDate()).toBe(10);
      expect(result.dateRange[1].getDate()).toBe(11);
      expect(result.dateRange[2].getDate()).toBe(12);
    });
  });

  describe('generateGanttRows', () => {
    it('GanttRowモデルの配列を生成できる', () => {
      setupSheets(
        [
          [
            'T-001',
            '',
            '親',
            '機能A',
            '// メモ\n説明',
            '山田太郎',
            '未着手',
            new Date('2024-01-10'),
            new Date('2024-01-12'),
            new Date('2024-01-09'),
          ],
          [
            'T-002',
            'T-001',
            '子',
            '設計',
            '',
            '山田太郎',
            '進行中',
            new Date('2024-01-10'),
            new Date('2024-01-11'),
            new Date('2024-01-09'),
          ],
        ],
        []
      );

      const result = service.generateGanttRows(
        new Date('2024-01-10'),
        new Date('2024-01-12')
      );

      expect(result).toHaveLength(2);

      // 親チケット行
      expect(result[0].parentName).toBe('機能A');
      expect(result[0].childName).toBe('');
      expect(result[0].memo).toBe('メモ');
      expect(result[0].backgroundColors).toBeDefined();

      // 子チケット行
      expect(result[1].parentName).toBe('機能A');
      expect(result[1].childName).toBe('設計');
    });
  });

  describe('背景色の適用', () => {
    it('チケット期間内の日付に色が適用される', () => {
      // 親チケット: 1/10〜1/14（5日間）
      // ガント表示範囲も親のmin/maxから計算されるので 1/10〜1/14
      setupSheets(
        [
          [
            'T-001',
            '',
            '親',
            '機能A',
            '',
            '山田太郎',
            '未着手',
            new Date('2024-01-10'),
            new Date('2024-01-14'),
            new Date('2024-01-09'),
          ],
        ],
        [['親チケット色', '#4285F4']]
      );

      const result = service.generateGantt({
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-14'),
      });

      // 固定列7つ + 日付5列 = 12列
      expect(result.backgrounds[0]).toHaveLength(12);

      // 全ての日付列が親チケット色で塗られている
      expect(result.backgrounds[0][7]).toBe('#4285F4'); // 1/10
      expect(result.backgrounds[0][8]).toBe('#4285F4'); // 1/11
      expect(result.backgrounds[0][9]).toBe('#4285F4'); // 1/12
      expect(result.backgrounds[0][10]).toBe('#4285F4'); // 1/13
      expect(result.backgrounds[0][11]).toBe('#4285F4'); // 1/14
    });

    it('子チケットは状態に応じた色が適用される', () => {
      setupSheets(
        [
          [
            'T-001',
            '',
            '親',
            '機能A',
            '',
            '山田太郎',
            '未着手',
            new Date('2024-01-10'),
            new Date('2024-01-12'),
            new Date('2024-01-09'),
          ],
          [
            'T-002',
            'T-001',
            '子',
            '設計',
            '',
            '山田太郎',
            '進行中',
            new Date('2024-01-10'),
            new Date('2024-01-10'),
            new Date('2024-01-09'),
          ],
        ],
        [
          ['子チケット色_未着手', '#E0E0E0'],
          ['子チケット色_進行中', '#FFC107'],
        ]
      );

      const result = service.generateGantt({
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-12'),
      });

      // 子チケット（進行中）の1/10は進行中の色
      expect(result.backgrounds[1][7]).toBe('#FFC107');
    });
  });
});
