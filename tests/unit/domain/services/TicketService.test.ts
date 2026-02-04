import { TicketService } from '../../../../src/domain/services/TicketService';
import { TicketRepository } from '../../../../src/infra/repositories/TicketRepository';
import { AssigneeRepository } from '../../../../src/infra/repositories/AssigneeRepository';
import { MockSpreadsheetWrapper } from '../../../helpers/MockSpreadsheet';

describe('TicketService', () => {
  let mockSpreadsheet: MockSpreadsheetWrapper;
  let ticketRepository: TicketRepository;
  let assigneeRepository: AssigneeRepository;
  let service: TicketService;

  const setupSheets = (tickets: unknown[][] = [], assignees: unknown[][] = []) => {
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
    mockSpreadsheet.addSheet('担当者リスト', [
      ['担当者名', 'メールアドレス'],
      ...assignees,
    ]);

    ticketRepository = new TicketRepository(mockSpreadsheet);
    assigneeRepository = new AssigneeRepository(mockSpreadsheet);
    service = new TicketService(ticketRepository, assigneeRepository);
  };

  beforeEach(() => {
    mockSpreadsheet = new MockSpreadsheetWrapper();
  });

  describe('getAllTickets', () => {
    it('全チケットを取得できる', () => {
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
            new Date('2024-01-20'),
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
            new Date('2024-01-12'),
            new Date('2024-01-09'),
          ],
        ],
        [['山田太郎', 'yamada@example.com']]
      );

      const result = service.getAllTickets();

      expect(result).toHaveLength(2);
    });
  });

  describe('getParentTickets', () => {
    it('親チケットのみを取得できる', () => {
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
            new Date('2024-01-20'),
            new Date('2024-01-09'),
          ],
          [
            'T-002',
            'T-001',
            '子',
            '設計',
            '',
            '山田太郎',
            '未着手',
            new Date('2024-01-10'),
            new Date('2024-01-12'),
            new Date('2024-01-09'),
          ],
        ],
        [['山田太郎', 'yamada@example.com']]
      );

      const result = service.getParentTickets();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('parent');
    });
  });

  describe('getChildTickets', () => {
    beforeEach(() => {
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
            new Date('2024-01-20'),
            new Date('2024-01-09'),
          ],
          [
            'T-002',
            'T-001',
            '子',
            '設計',
            '',
            '山田太郎',
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
            '山田太郎',
            '未着手',
            new Date('2024-01-13'),
            new Date('2024-01-17'),
            new Date('2024-01-09'),
          ],
        ],
        [['山田太郎', 'yamada@example.com']]
      );
    });

    it('全子チケットを取得できる', () => {
      const result = service.getChildTickets();

      expect(result).toHaveLength(2);
      expect(result.every(t => t.type === 'child')).toBe(true);
    });

    it('特定の親の子チケットのみを取得できる', () => {
      const result = service.getChildTickets('T-001');

      expect(result).toHaveLength(2);
      expect(result.every(t => t.parentId === 'T-001')).toBe(true);
    });
  });

  describe('createTicket', () => {
    it('親チケットを作成できる', () => {
      setupSheets([], [['山田太郎', 'yamada@example.com']]);

      const result = service.createTicket({
        name: '機能A開発',
        description: '説明',
        assignee: '山田太郎',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-20'),
      });

      expect(result.id).toBe('T-001');
      expect(result.type).toBe('parent');
      expect(result.parentId).toBeNull();
      expect(result.name).toBe('機能A開発');
      expect(result.status).toBe('notStarted');
    });

    it('子チケットを作成できる', () => {
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
            new Date('2024-01-20'),
            new Date('2024-01-09'),
          ],
        ],
        [['山田太郎', 'yamada@example.com']]
      );

      const result = service.createTicket({
        parentId: 'T-001',
        name: '設計',
        description: '詳細設計',
        assignee: '山田太郎',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-12'),
      });

      expect(result.id).toBe('T-002');
      expect(result.type).toBe('child');
      expect(result.parentId).toBe('T-001');
    });

    it('チケット名が空の場合はエラーを投げる', () => {
      setupSheets([], [['山田太郎', 'yamada@example.com']]);

      expect(() =>
        service.createTicket({
          name: '',
          description: '',
          assignee: '山田太郎',
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-20'),
        })
      ).toThrow('チケット名は必須です');
    });

    it('存在しない担当者の場合はエラーを投げる', () => {
      setupSheets([], [['山田太郎', 'yamada@example.com']]);

      expect(() =>
        service.createTicket({
          name: '機能A',
          description: '',
          assignee: '存在しない担当者',
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-20'),
        })
      ).toThrow('担当者 "存在しない担当者" が存在しません');
    });

    it('終了日が開始日より前の場合はエラーを投げる', () => {
      setupSheets([], [['山田太郎', 'yamada@example.com']]);

      expect(() =>
        service.createTicket({
          name: '機能A',
          description: '',
          assignee: '山田太郎',
          startDate: new Date('2024-01-20'),
          endDate: new Date('2024-01-10'),
        })
      ).toThrow('終了日は開始日以降である必要があります');
    });

    it('存在しない親チケットIDを指定するとエラーを投げる', () => {
      setupSheets([], [['山田太郎', 'yamada@example.com']]);

      expect(() =>
        service.createTicket({
          parentId: 'T-999',
          name: '設計',
          description: '',
          assignee: '山田太郎',
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-12'),
        })
      ).toThrow('親チケット "T-999" が存在しません');
    });
  });

  describe('saveTickets', () => {
    it('チケットを一括保存できる', () => {
      setupSheets([], [['山田太郎', 'yamada@example.com']]);

      const tickets = [
        {
          id: 'T-001',
          parentId: null,
          type: 'parent' as const,
          name: '機能A',
          description: '',
          assignee: '山田太郎',
          status: 'notStarted' as const,
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-20'),
          createdAt: new Date('2024-01-09'),
        },
      ];

      service.saveTickets(tickets);

      const saved = service.getAllTickets();
      expect(saved).toHaveLength(1);
      expect(saved[0].name).toBe('機能A');
    });

    it('存在しない担当者のチケットはエラーを投げる', () => {
      setupSheets([], [['山田太郎', 'yamada@example.com']]);

      const tickets = [
        {
          id: 'T-001',
          parentId: null,
          type: 'parent' as const,
          name: '機能A',
          description: '',
          assignee: '存在しない担当者',
          status: 'notStarted' as const,
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-20'),
          createdAt: new Date('2024-01-09'),
        },
      ];

      expect(() => service.saveTickets(tickets)).toThrow(
        '担当者 "存在しない担当者" が存在しません'
      );
    });
  });

  describe('getTicketHierarchy', () => {
    it('親子関係を階層構造で取得できる', () => {
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
            new Date('2024-01-20'),
            new Date('2024-01-09'),
          ],
          [
            'T-002',
            'T-001',
            '子',
            '設計',
            '',
            '山田太郎',
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
            '山田太郎',
            '未着手',
            new Date('2024-01-13'),
            new Date('2024-01-17'),
            new Date('2024-01-09'),
          ],
        ],
        [['山田太郎', 'yamada@example.com']]
      );

      const result = service.getTicketHierarchy();

      expect(result.size).toBe(1);
      const parent = Array.from(result.keys())[0];
      expect(parent.name).toBe('機能A');
      const children = result.get(parent);
      expect(children).toHaveLength(2);
    });
  });

  describe('getStatusLabel', () => {
    it('ステータスラベルを取得できる', () => {
      setupSheets([], []);

      expect(service.getStatusLabel('notStarted')).toBe('未着手');
      expect(service.getStatusLabel('inProgress')).toBe('進行中');
      expect(service.getStatusLabel('completed')).toBe('完了');
    });
  });
});
