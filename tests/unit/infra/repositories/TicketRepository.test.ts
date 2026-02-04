import { TicketRepository } from '../../../../src/infra/repositories/TicketRepository';
import { MockSpreadsheetWrapper } from '../../../helpers/MockSpreadsheet';

describe('TicketRepository', () => {
  let mockSpreadsheet: MockSpreadsheetWrapper;
  let repository: TicketRepository;

  const createTicketSheet = (data: unknown[][] = []) => {
    const header = [
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
    ];
    mockSpreadsheet.addSheet('チケット管理', [header, ...data]);
  };

  beforeEach(() => {
    mockSpreadsheet = new MockSpreadsheetWrapper();
  });

  describe('findAll', () => {
    it('全チケットを取得できる', () => {
      createTicketSheet([
        [
          'T-001',
          '',
          '親',
          '機能A開発',
          '説明',
          '山田太郎',
          '進行中',
          new Date('2024-01-10'),
          new Date('2024-01-20'),
          new Date('2024-01-09'),
        ],
        [
          'T-002',
          'T-001',
          '子',
          '設計',
          '設計作業',
          '山田太郎',
          '完了',
          new Date('2024-01-10'),
          new Date('2024-01-12'),
          new Date('2024-01-09'),
        ],
      ]);
      repository = new TicketRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('T-001');
      expect(result[0].type).toBe('parent');
      expect(result[0].status).toBe('inProgress');
      expect(result[1].id).toBe('T-002');
      expect(result[1].parentId).toBe('T-001');
      expect(result[1].type).toBe('child');
    });

    it('ヘッダのみの場合は空配列を返す', () => {
      createTicketSheet();
      repository = new TicketRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findParents', () => {
    it('親チケットのみを取得できる', () => {
      createTicketSheet([
        [
          'T-001',
          '',
          '親',
          '機能A',
          '',
          '山田',
          '未着手',
          new Date('2024-01-10'),
          new Date('2024-01-20'),
          new Date('2024-01-09'),
        ],
        [
          'T-002',
          'T-001',
          '子',
          '設計',
          '',
          '山田',
          '未着手',
          new Date('2024-01-10'),
          new Date('2024-01-12'),
          new Date('2024-01-09'),
        ],
        [
          'T-003',
          '',
          '親',
          '機能B',
          '',
          '鈴木',
          '未着手',
          new Date('2024-01-15'),
          new Date('2024-01-25'),
          new Date('2024-01-09'),
        ],
      ]);
      repository = new TicketRepository(mockSpreadsheet);

      const result = repository.findParents();

      expect(result).toHaveLength(2);
      expect(result.every(t => t.type === 'parent')).toBe(true);
    });
  });

  describe('findChildren', () => {
    beforeEach(() => {
      createTicketSheet([
        [
          'T-001',
          '',
          '親',
          '機能A',
          '',
          '山田',
          '未着手',
          new Date('2024-01-10'),
          new Date('2024-01-20'),
          new Date('2024-01-09'),
        ],
        [
          'T-002',
          'T-001',
          '子',
          '設計',
          '',
          '山田',
          '未着手',
          new Date('2024-01-10'),
          new Date('2024-01-12'),
          new Date('2024-01-09'),
        ],
        [
          'T-003',
          'T-001',
          '子',
          '実装',
          '',
          '山田',
          '未着手',
          new Date('2024-01-13'),
          new Date('2024-01-18'),
          new Date('2024-01-09'),
        ],
        [
          'T-004',
          '',
          '親',
          '機能B',
          '',
          '鈴木',
          '未着手',
          new Date('2024-01-15'),
          new Date('2024-01-25'),
          new Date('2024-01-09'),
        ],
        [
          'T-005',
          'T-004',
          '子',
          '設計B',
          '',
          '鈴木',
          '未着手',
          new Date('2024-01-15'),
          new Date('2024-01-17'),
          new Date('2024-01-09'),
        ],
      ]);
      repository = new TicketRepository(mockSpreadsheet);
    });

    it('全子チケットを取得できる', () => {
      const result = repository.findChildren();

      expect(result).toHaveLength(3);
      expect(result.every(t => t.type === 'child')).toBe(true);
    });

    it('特定の親の子チケットのみを取得できる', () => {
      const result = repository.findChildren('T-001');

      expect(result).toHaveLength(2);
      expect(result.every(t => t.parentId === 'T-001')).toBe(true);
    });
  });

  describe('findById', () => {
    beforeEach(() => {
      createTicketSheet([
        [
          'T-001',
          '',
          '親',
          '機能A',
          '',
          '山田',
          '未着手',
          new Date('2024-01-10'),
          new Date('2024-01-20'),
          new Date('2024-01-09'),
        ],
      ]);
      repository = new TicketRepository(mockSpreadsheet);
    });

    it('IDでチケットを取得できる', () => {
      const result = repository.findById('T-001');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('機能A');
    });

    it('存在しないIDはnullを返す', () => {
      const result = repository.findById('T-999');

      expect(result).toBeNull();
    });
  });

  describe('findParentsInPeriod', () => {
    beforeEach(() => {
      createTicketSheet([
        // 1/10-1/15
        [
          'T-001',
          '',
          '親',
          '機能A',
          '',
          '山田',
          '未着手',
          new Date('2024-01-10'),
          new Date('2024-01-15'),
          new Date('2024-01-09'),
        ],
        // 1/20-1/25
        [
          'T-002',
          '',
          '親',
          '機能B',
          '',
          '鈴木',
          '未着手',
          new Date('2024-01-20'),
          new Date('2024-01-25'),
          new Date('2024-01-09'),
        ],
        // 1/30-2/5
        [
          'T-003',
          '',
          '親',
          '機能C',
          '',
          '田中',
          '未着手',
          new Date('2024-01-30'),
          new Date('2024-02-05'),
          new Date('2024-01-09'),
        ],
      ]);
      repository = new TicketRepository(mockSpreadsheet);
    });

    it('指定期間と重なるチケットを全て取得できる', () => {
      const result = repository.findParentsInPeriod(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      // T-003(1/30-2/5)も1月と重なるため含まれる
      expect(result).toHaveLength(3);
    });

    it('指定期間と部分的に重なるチケットも取得できる', () => {
      const result = repository.findParentsInPeriod(
        new Date('2024-01-12'),
        new Date('2024-01-22')
      );

      expect(result).toHaveLength(2); // T-001（1/10-15）とT-002（1/20-25）
    });

    it('指定期間外のチケットは取得されない', () => {
      const result = repository.findParentsInPeriod(
        new Date('2024-02-10'),
        new Date('2024-02-28')
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('getNextId', () => {
    it('チケットがない場合はT-001を返す', () => {
      createTicketSheet();
      repository = new TicketRepository(mockSpreadsheet);

      const result = repository.getNextId();

      expect(result).toBe('T-001');
    });

    it('既存チケットがある場合は次の番号を返す', () => {
      createTicketSheet([
        [
          'T-001',
          '',
          '親',
          '機能A',
          '',
          '山田',
          '未着手',
          new Date('2024-01-10'),
          new Date('2024-01-20'),
          new Date('2024-01-09'),
        ],
        [
          'T-003',
          '',
          '親',
          '機能B',
          '',
          '鈴木',
          '未着手',
          new Date('2024-01-15'),
          new Date('2024-01-25'),
          new Date('2024-01-09'),
        ],
      ]);
      repository = new TicketRepository(mockSpreadsheet);

      const result = repository.getNextId();

      expect(result).toBe('T-004');
    });
  });

  describe('generateIds', () => {
    it('連続したIDを生成できる', () => {
      createTicketSheet([
        [
          'T-001',
          '',
          '親',
          '機能A',
          '',
          '山田',
          '未着手',
          new Date('2024-01-10'),
          new Date('2024-01-20'),
          new Date('2024-01-09'),
        ],
      ]);
      repository = new TicketRepository(mockSpreadsheet);

      const result = repository.generateIds(3);

      expect(result).toEqual(['T-002', 'T-003', 'T-004']);
    });
  });

  describe('saveAll', () => {
    it('チケットを保存できる', () => {
      createTicketSheet();
      repository = new TicketRepository(mockSpreadsheet);

      const tickets = [
        {
          id: 'T-001',
          parentId: null,
          type: 'parent' as const,
          name: '機能A開発',
          description: '説明文',
          assignee: '山田太郎',
          status: 'notStarted' as const,
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-20'),
          createdAt: new Date('2024-01-09'),
        },
      ];

      repository.saveAll(tickets);

      const saved = repository.findAll();
      expect(saved).toHaveLength(1);
      expect(saved[0].id).toBe('T-001');
      expect(saved[0].name).toBe('機能A開発');
    });
  });
});
