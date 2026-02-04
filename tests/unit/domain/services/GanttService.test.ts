import { GanttService, IGanttTicketRepository } from '../../../../src/domain/services/GanttService';
import { SettingsRepository } from '../../../../src/infra/repositories/SettingsRepository';
import { MockSpreadsheetWrapper } from '../../../helpers/MockSpreadsheet';
import { Ticket } from '../../../../src/domain/models/Ticket';

describe('GanttService', () => {
  let mockSpreadsheet: MockSpreadsheetWrapper;
  let mockTicketRepository: IGanttTicketRepository;
  let settingsRepository: SettingsRepository;
  let service: GanttService;
  let tickets: Ticket[];

  const createTicket = (
    id: string,
    parentId: string | null,
    type: 'parent' | 'child',
    name: string,
    description: string,
    assignee: string,
    status: 'notStarted' | 'inProgress' | 'completed',
    startDate: Date,
    endDate: Date
  ): Ticket => ({
    id,
    parentId,
    type,
    name,
    description,
    assignee,
    status,
    startDate,
    endDate,
    createdAt: new Date('2024-01-09'),
  });

  const setupService = (ticketData: Ticket[] = [], settings: unknown[][] = []) => {
    tickets = ticketData;

    // IGanttTicketRepositoryのモック
    mockTicketRepository = {
      findParentsInPeriod: (start: Date, end: Date) =>
        tickets.filter((t) => {
          if (t.type !== 'parent') return false;
          return t.startDate <= end && t.endDate >= start;
        }),
      findChildren: (parentId: string) =>
        tickets.filter((t) => t.parentId === parentId),
    };

    mockSpreadsheet.addSheet('可視化設定', [
      ['設定名', '設定値'],
      ...settings,
    ]);

    settingsRepository = new SettingsRepository(mockSpreadsheet);
    service = new GanttService(mockTicketRepository, settingsRepository);
  };

  beforeEach(() => {
    mockSpreadsheet = new MockSpreadsheetWrapper();
  });

  describe('generateGantt', () => {
    it('ガントチャートデータを生成できる', () => {
      setupService(
        [
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A',
            '// メモ\n説明',
            '山田太郎',
            'notStarted',
            new Date('2024-01-10'),
            new Date('2024-01-12')
          ),
          createTicket(
            'T-002',
            'T-001',
            'child',
            '設計',
            '// 設計メモ\n詳細',
            '山田太郎',
            'inProgress',
            new Date('2024-01-10'),
            new Date('2024-01-11')
          ),
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
      setupService(
        [
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A',
            '',
            '山田太郎',
            'notStarted',
            new Date('2024-02-01'),
            new Date('2024-02-10')
          ),
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
      setupService(
        [
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A',
            '',
            '山田太郎',
            'notStarted',
            new Date('2024-01-25'),
            new Date('2024-02-05')
          ),
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
      setupService(
        [
          // 親チケット1
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A',
            '',
            '山田太郎',
            'notStarted',
            new Date('2024-01-10'),
            new Date('2024-01-15')
          ),
          // 親チケット1の子
          createTicket(
            'T-002',
            'T-001',
            'child',
            '設計A',
            '',
            '山田太郎',
            'notStarted',
            new Date('2024-01-10'),
            new Date('2024-01-12')
          ),
          // 親チケット2
          createTicket(
            'T-003',
            null,
            'parent',
            '機能B',
            '',
            '鈴木花子',
            'inProgress',
            new Date('2024-01-12'),
            new Date('2024-01-18')
          ),
          // 親チケット2の子
          createTicket(
            'T-004',
            'T-003',
            'child',
            '設計B',
            '',
            '鈴木花子',
            'inProgress',
            new Date('2024-01-12'),
            new Date('2024-01-14')
          ),
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
      setupService(
        [
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A',
            '',
            '山田太郎',
            'notStarted',
            new Date('2024-01-10'),
            new Date('2024-01-12')
          ),
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
      setupService(
        [
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A',
            '// メモ\n説明',
            '山田太郎',
            'notStarted',
            new Date('2024-01-10'),
            new Date('2024-01-12')
          ),
          createTicket(
            'T-002',
            'T-001',
            'child',
            '設計',
            '',
            '山田太郎',
            'inProgress',
            new Date('2024-01-10'),
            new Date('2024-01-11')
          ),
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
      setupService(
        [
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A',
            '',
            '山田太郎',
            'notStarted',
            new Date('2024-01-10'),
            new Date('2024-01-14')
          ),
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
      setupService(
        [
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A',
            '',
            '山田太郎',
            'notStarted',
            new Date('2024-01-10'),
            new Date('2024-01-12')
          ),
          createTicket(
            'T-002',
            'T-001',
            'child',
            '設計',
            '',
            '山田太郎',
            'inProgress',
            new Date('2024-01-10'),
            new Date('2024-01-10')
          ),
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
