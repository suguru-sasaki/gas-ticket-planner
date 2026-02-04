import { TemplateService } from '../../../../src/domain/services/TemplateService';
import { TemplateRepository } from '../../../../src/infra/repositories/TemplateRepository';
import { TicketRepository } from '../../../../src/infra/repositories/TicketRepository';
import { AssigneeRepository } from '../../../../src/infra/repositories/AssigneeRepository';
import { MockSpreadsheetWrapper } from '../../../helpers/MockSpreadsheet';

describe('TemplateService', () => {
  let mockSpreadsheet: MockSpreadsheetWrapper;
  let templateRepository: TemplateRepository;
  let ticketRepository: TicketRepository;
  let assigneeRepository: AssigneeRepository;
  let service: TemplateService;

  const setupSheets = (
    templates: unknown[][] = [],
    tickets: unknown[][] = [],
    assignees: unknown[][] = []
  ) => {
    mockSpreadsheet.addSheet('テンプレート', [
      ['テンプレート名', '説明文', '開始日オフセット', '期間（日数）'],
      ...templates,
    ]);
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

    templateRepository = new TemplateRepository(mockSpreadsheet);
    ticketRepository = new TicketRepository(mockSpreadsheet);
    assigneeRepository = new AssigneeRepository(mockSpreadsheet);
    service = new TemplateService(
      templateRepository,
      ticketRepository,
      assigneeRepository
    );
  };

  beforeEach(() => {
    mockSpreadsheet = new MockSpreadsheetWrapper();
  });

  describe('expandChildTickets', () => {
    it('テンプレートから親チケットと子チケットを展開できる', () => {
      setupSheets(
        [
          ['設計', '基本設計', 0, 3],
          ['実装', 'コーディング', 3, 5],
          ['テスト', '単体テスト', 8, 2],
        ],
        [],
        [['山田太郎', 'yamada@example.com']]
      );

      const result = service.expandChildTickets({
        parentName: '機能A開発',
        parentDescription: '機能Aの開発作業',
        assignee: '山田太郎',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-31'), // ユーザー入力の終了日
      });

      // 親チケット確認
      expect(result.parent.id).toBe('T-001');
      expect(result.parent.type).toBe('parent');
      expect(result.parent.name).toBe('機能A開発');
      expect(result.parent.assignee).toBe('山田太郎');
      expect(result.parent.startDate).toEqual(new Date('2024-01-10'));
      // 親の終了日 = ユーザー入力値
      expect(result.parent.endDate).toEqual(new Date('2024-01-31'));

      // 子チケット確認
      expect(result.children).toHaveLength(3);

      // 設計 (開始日+0日〜開始日+2日)
      expect(result.children[0].id).toBe('T-002');
      expect(result.children[0].parentId).toBe('T-001');
      expect(result.children[0].type).toBe('child');
      expect(result.children[0].name).toBe('設計');
      expect(result.children[0].startDate).toEqual(new Date('2024-01-10'));
      expect(result.children[0].endDate).toEqual(new Date('2024-01-12'));

      // 実装 (開始日+3日〜開始日+7日)
      expect(result.children[1].name).toBe('実装');
      expect(result.children[1].startDate).toEqual(new Date('2024-01-13'));
      expect(result.children[1].endDate).toEqual(new Date('2024-01-17'));

      // テスト (開始日+8日〜開始日+9日)
      expect(result.children[2].name).toBe('テスト');
      expect(result.children[2].startDate).toEqual(new Date('2024-01-18'));
      expect(result.children[2].endDate).toEqual(new Date('2024-01-19'));
    });

    it('既存チケットがある場合は適切なIDが採番される', () => {
      setupSheets(
        [['設計', '', 0, 3]],
        [
          [
            'T-001',
            '',
            '親',
            '既存チケット',
            '',
            '山田太郎',
            '未着手',
            new Date('2024-01-01'),
            new Date('2024-01-10'),
            new Date('2024-01-01'),
          ],
        ],
        [['山田太郎', 'yamada@example.com']]
      );

      const result = service.expandChildTickets({
        parentName: '新規機能',
        parentDescription: '',
        assignee: '山田太郎',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-28'),
      });

      expect(result.parent.id).toBe('T-002');
      expect(result.children[0].id).toBe('T-003');
    });

    it('存在しない担当者の場合はエラーを投げる', () => {
      setupSheets(
        [['設計', '', 0, 3]],
        [],
        [['山田太郎', 'yamada@example.com']]
      );

      expect(() =>
        service.expandChildTickets({
          parentName: '機能A開発',
          parentDescription: '',
          assignee: '存在しない担当者',
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-31'),
        })
      ).toThrow('担当者 "存在しない担当者" が存在しません');
    });

    it('テンプレートが空の場合はエラーを投げる', () => {
      setupSheets([], [], [['山田太郎', 'yamada@example.com']]);

      expect(() =>
        service.expandChildTickets({
          parentName: '機能A開発',
          parentDescription: '',
          assignee: '山田太郎',
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-31'),
        })
      ).toThrow('テンプレートが登録されていません');
    });

    it('子チケットは全て未着手状態で作成される', () => {
      setupSheets(
        [
          ['設計', '', 0, 3],
          ['実装', '', 3, 5],
        ],
        [],
        [['山田太郎', 'yamada@example.com']]
      );

      const result = service.expandChildTickets({
        parentName: '機能A開発',
        parentDescription: '',
        assignee: '山田太郎',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-31'),
      });

      expect(result.parent.status).toBe('notStarted');
      expect(result.children.every(c => c.status === 'notStarted')).toBe(true);
    });

    it('テンプレートの説明が子チケットに反映される', () => {
      setupSheets(
        [['設計', '// 重要：レビュー必須\n基本設計・詳細設計', 0, 3]],
        [],
        [['山田太郎', 'yamada@example.com']]
      );

      const result = service.expandChildTickets({
        parentName: '機能A開発',
        parentDescription: '',
        assignee: '山田太郎',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-31'),
      });

      expect(result.children[0].description).toBe(
        '// 重要：レビュー必須\n基本設計・詳細設計'
      );
    });
  });
});
