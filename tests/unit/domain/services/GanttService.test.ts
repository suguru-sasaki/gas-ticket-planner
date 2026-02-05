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
    status: 'notStarted' | 'inProgress' | 'processed' | 'completed',
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
    it('ガントチャートデータを生成できる（説明文なし）', () => {
      setupService(
        [
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A',
            '説明文テスト',
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
            '設計の説明',
            '山田太郎',
            'inProgress',
            new Date('2024-01-10'),
            new Date('2024-01-11')
          ),
        ],
        [
          ['親チケット色', '#ddefe5'],
          ['子チケット色_未対応', '#ee7f77'],
          ['子チケット色_処理中', '#4389c5'],
          ['子チケット色_処理済み', '#5db5a5'],
          ['子チケット色_完了', '#a1af2f'],
        ]
      );

      const result = service.generateGantt({
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-12'),
        includeDescription: false,
      });

      // ヘッダ確認（説明文なし: 6列 + 日付3列）
      expect(result.headers).toHaveLength(9);
      expect(result.headers[0]).toBe('親チケット名');
      expect(result.headers[1]).toBe('子チケット名');
      expect(result.headers[2]).toBe('担当者');
      expect(result.headers[3]).toBe('状態');
      expect(result.headers[6]).toMatch(/1\/10/);

      // 行数確認（親1 + 子1）
      expect(result.rows).toHaveLength(2);

      // 親チケット行確認
      expect(result.rows[0].parentName).toBe('機能A');
      expect(result.rows[0].childName).toBe('');
      expect(result.rows[0].description).toBe(''); // 説明文なし
      expect(result.rows[0].assignee).toBe('山田太郎');
      expect(result.rows[0].status).toBe('未対応');

      // 子チケット行確認
      expect(result.rows[1].parentName).toBe('機能A');
      expect(result.rows[1].childName).toBe('設計');
      expect(result.rows[1].description).toBe(''); // 説明文なし
      expect(result.rows[1].status).toBe('処理中');

      // 背景色配列確認
      expect(result.backgrounds).toHaveLength(2);
      expect(result.backgrounds[0]).toHaveLength(9); // 固定6列 + 日付3列
      expect(result.includeDescription).toBe(false);
    });

    it('ガントチャートデータを生成できる（説明文あり）', () => {
      setupService(
        [
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A',
            '説明文テスト',
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
        includeDescription: true,
      });

      // ヘッダ確認（説明文あり: 7列 + 日付3列）
      expect(result.headers).toHaveLength(10);
      expect(result.headers[0]).toBe('親チケット名');
      expect(result.headers[1]).toBe('子チケット名');
      expect(result.headers[2]).toBe('説明文');
      expect(result.headers[3]).toBe('担当者');
      expect(result.headers[7]).toMatch(/1\/10/);

      // 説明文が含まれている
      expect(result.rows[0].description).toBe('説明文テスト');
      expect(result.backgrounds[0]).toHaveLength(10); // 固定7列 + 日付3列
      expect(result.includeDescription).toBe(true);
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
            '説明文テスト',
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
        new Date('2024-01-12'),
        true // includeDescription
      );

      expect(result).toHaveLength(2);

      // 親チケット行
      expect(result[0].parentName).toBe('機能A');
      expect(result[0].childName).toBe('');
      expect(result[0].description).toBe('説明文テスト');
      expect(result[0].backgroundColors).toBeDefined();

      // 子チケット行
      expect(result[1].parentName).toBe('機能A');
      expect(result[1].childName).toBe('設計');
    });
  });

  describe('背景色の適用', () => {
    it('チケット期間内の日付に色が適用される', () => {
      // 未来の日付を使用して遅延判定を避ける
      const futureStart = new Date('2099-01-10');
      const futureEnd = new Date('2099-01-14');

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
            futureStart,
            futureEnd
          ),
        ],
        [['親チケット色', '#4285F4']]
      );

      const result = service.generateGantt({
        startDate: futureStart,
        endDate: futureEnd,
      });

      // 固定列6つ + 日付5列 = 11列（説明文なし）
      expect(result.backgrounds[0]).toHaveLength(11);

      // 全ての日付列が親チケット色で塗られている
      expect(result.backgrounds[0][6]).toBe('#4285F4'); // 1/10
      expect(result.backgrounds[0][7]).toBe('#4285F4'); // 1/11
      expect(result.backgrounds[0][8]).toBe('#4285F4'); // 1/12
      expect(result.backgrounds[0][9]).toBe('#4285F4'); // 1/13
      expect(result.backgrounds[0][10]).toBe('#4285F4'); // 1/14
    });

    it('子チケットは状態に応じた色が適用される', () => {
      // 未来の日付を使用して遅延判定を避ける
      const futureStart = new Date('2099-01-10');
      const futureEnd = new Date('2099-01-12');

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
            futureStart,
            futureEnd
          ),
          createTicket(
            'T-002',
            'T-001',
            'child',
            '設計',
            '',
            '山田太郎',
            'inProgress',
            futureStart,
            futureStart
          ),
        ],
        [
          ['子チケット色_未対応', '#E0E0E0'],
          ['子チケット色_処理中', '#FFC107'],
        ]
      );

      const result = service.generateGantt({
        startDate: futureStart,
        endDate: futureEnd,
      });

      // 子チケット（処理中）の1/10は処理中の色
      expect(result.backgrounds[1][6]).toBe('#FFC107');
    });

    it('遅延チケットの終了日セルに遅延色が適用される', () => {
      // 終了日が過去で未完了のチケット
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const pastEndDate = new Date();
      pastEndDate.setDate(pastEndDate.getDate() - 3);

      setupService(
        [
          createTicket(
            'T-001',
            null,
            'parent',
            '遅延チケット',
            '',
            '山田太郎',
            'inProgress', // 未完了
            pastDate,
            pastEndDate
          ),
        ],
        [
          ['親チケット色', '#ddefe5'],
          ['遅延色', '#FF0000'],
        ]
      );

      const result = service.generateGantt({
        startDate: pastDate,
        endDate: pastEndDate,
      });

      // 終了日のセルが遅延色になっている
      const lastDateIndex = result.backgrounds[0].length - 1;
      expect(result.backgrounds[0][lastDateIndex]).toBe('#FF0000');
    });

    it('完了チケットは遅延色が適用されない', () => {
      // 終了日が過去だが完了しているチケット
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const pastEndDate = new Date();
      pastEndDate.setDate(pastEndDate.getDate() - 3);

      setupService(
        [
          createTicket(
            'T-001',
            null,
            'parent',
            '完了チケット',
            '',
            '山田太郎',
            'completed', // 完了
            pastDate,
            pastEndDate
          ),
        ],
        [
          ['親チケット色', '#ddefe5'],
          ['遅延色', '#FF0000'],
        ]
      );

      const result = service.generateGantt({
        startDate: pastDate,
        endDate: pastEndDate,
      });

      // 終了日のセルが親チケット色のままで、遅延色ではない
      const lastDateIndex = result.backgrounds[0].length - 1;
      expect(result.backgrounds[0][lastDateIndex]).toBe('#ddefe5');
    });
  });

  describe('ソート順序', () => {
    it('親チケットは開始日昇順でソートされる', () => {
      setupService(
        [
          createTicket(
            'T-003',
            null,
            'parent',
            '機能C（遅い開始）',
            '',
            '山田太郎',
            'notStarted',
            new Date('2099-01-15'),
            new Date('2099-01-20')
          ),
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A（早い開始）',
            '',
            '山田太郎',
            'notStarted',
            new Date('2099-01-10'),
            new Date('2099-01-12')
          ),
          createTicket(
            'T-002',
            null,
            'parent',
            '機能B（中間）',
            '',
            '山田太郎',
            'notStarted',
            new Date('2099-01-12'),
            new Date('2099-01-18')
          ),
        ],
        []
      );

      const result = service.generateGantt({
        startDate: new Date('2099-01-10'),
        endDate: new Date('2099-01-20'),
      });

      // 開始日順: 機能A(1/10) → 機能B(1/12) → 機能C(1/15)
      expect(result.rows[0].parentName).toBe('機能A（早い開始）');
      expect(result.rows[1].parentName).toBe('機能B（中間）');
      expect(result.rows[2].parentName).toBe('機能C（遅い開始）');
    });

    it('開始日が同じ場合は終了日昇順でソートされる', () => {
      setupService(
        [
          createTicket(
            'T-002',
            null,
            'parent',
            '機能B（終了日遅い）',
            '',
            '山田太郎',
            'notStarted',
            new Date('2099-01-10'),
            new Date('2099-01-20')
          ),
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A（終了日早い）',
            '',
            '山田太郎',
            'notStarted',
            new Date('2099-01-10'),
            new Date('2099-01-12')
          ),
        ],
        []
      );

      const result = service.generateGantt({
        startDate: new Date('2099-01-10'),
        endDate: new Date('2099-01-20'),
      });

      // 開始日同じ→終了日順: 機能A(終了1/12) → 機能B(終了1/20)
      expect(result.rows[0].parentName).toBe('機能A（終了日早い）');
      expect(result.rows[1].parentName).toBe('機能B（終了日遅い）');
    });

    it('開始日と終了日が同じ場合はID昇順でソートされる', () => {
      setupService(
        [
          createTicket(
            'T-003',
            null,
            'parent',
            '機能C（ID大）',
            '',
            '山田太郎',
            'notStarted',
            new Date('2099-01-10'),
            new Date('2099-01-15')
          ),
          createTicket(
            'T-001',
            null,
            'parent',
            '機能A（ID小）',
            '',
            '山田太郎',
            'notStarted',
            new Date('2099-01-10'),
            new Date('2099-01-15')
          ),
          createTicket(
            'T-002',
            null,
            'parent',
            '機能B（ID中）',
            '',
            '山田太郎',
            'notStarted',
            new Date('2099-01-10'),
            new Date('2099-01-15')
          ),
        ],
        []
      );

      const result = service.generateGantt({
        startDate: new Date('2099-01-10'),
        endDate: new Date('2099-01-15'),
      });

      // 開始日・終了日同じ→ID順: T-001 → T-002 → T-003
      expect(result.rows[0].parentName).toBe('機能A（ID小）');
      expect(result.rows[1].parentName).toBe('機能B（ID中）');
      expect(result.rows[2].parentName).toBe('機能C（ID大）');
    });

    it('子チケットも開始日→終了日→ID順でソートされる', () => {
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
            new Date('2099-01-10'),
            new Date('2099-01-20')
          ),
          createTicket(
            'T-004',
            'T-001',
            'child',
            '子C（遅い開始）',
            '',
            '山田太郎',
            'notStarted',
            new Date('2099-01-15'),
            new Date('2099-01-18')
          ),
          createTicket(
            'T-002',
            'T-001',
            'child',
            '子A（早い開始）',
            '',
            '山田太郎',
            'notStarted',
            new Date('2099-01-10'),
            new Date('2099-01-12')
          ),
          createTicket(
            'T-003',
            'T-001',
            'child',
            '子B（中間）',
            '',
            '山田太郎',
            'notStarted',
            new Date('2099-01-12'),
            new Date('2099-01-14')
          ),
        ],
        []
      );

      const result = service.generateGantt({
        startDate: new Date('2099-01-10'),
        endDate: new Date('2099-01-20'),
      });

      // 親 → 子の順、子は開始日順
      expect(result.rows[0].parentName).toBe('機能A');
      expect(result.rows[0].childName).toBe('');
      expect(result.rows[1].childName).toBe('子A（早い開始）');
      expect(result.rows[2].childName).toBe('子B（中間）');
      expect(result.rows[3].childName).toBe('子C（遅い開始）');
    });
  });
});
