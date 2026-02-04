/**
 * 統合テスト: チケット作成フロー
 * テンプレートからの子チケット展開 → 保存 → 取得の一連の流れをテスト
 */
import { TemplateService } from '../../src/domain/services/TemplateService';
import { TicketService } from '../../src/domain/services/TicketService';
import { TemplateRepository } from '../../src/infra/repositories/TemplateRepository';
import { TicketRepository } from '../../src/infra/repositories/TicketRepository';
import { AssigneeRepository } from '../../src/infra/repositories/AssigneeRepository';
import { MockSpreadsheetWrapper } from '../helpers/MockSpreadsheet';

describe('統合テスト: チケット作成フロー', () => {
  let mockSpreadsheet: MockSpreadsheetWrapper;
  let templateRepository: TemplateRepository;
  let ticketRepository: TicketRepository;
  let assigneeRepository: AssigneeRepository;
  let templateService: TemplateService;
  let ticketService: TicketService;

  const setupSheets = () => {
    // テンプレートシート
    mockSpreadsheet.addSheet('テンプレート', [
      ['テンプレート名', '説明文', '開始日オフセット', '期間（日数）'],
      ['要件定義', '// 顧客要望の整理\n要件をまとめる', 0, 3],
      ['設計', '// 技術仕様の決定\n基本設計・詳細設計', 3, 5],
      ['実装', 'コーディング作業', 8, 7],
      ['テスト', '// レビュー必須\n単体・結合テスト', 15, 3],
      ['リリース', '本番デプロイ', 18, 1],
    ]);

    // チケット管理シート
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
    ]);

    // 担当者リストシート
    mockSpreadsheet.addSheet('担当者リスト', [
      ['担当者名', 'メールアドレス'],
      ['山田太郎', 'yamada@example.com'],
      ['鈴木花子', 'suzuki@example.com'],
      ['田中一郎', 'tanaka@example.com'],
    ]);

    templateRepository = new TemplateRepository(mockSpreadsheet);
    ticketRepository = new TicketRepository(mockSpreadsheet);
    assigneeRepository = new AssigneeRepository(mockSpreadsheet);
    templateService = new TemplateService(
      templateRepository,
      ticketRepository,
      assigneeRepository
    );
    ticketService = new TicketService(ticketRepository, assigneeRepository);
  };

  beforeEach(() => {
    mockSpreadsheet = new MockSpreadsheetWrapper();
    setupSheets();
  });

  describe('テンプレートからのチケット作成→保存→取得', () => {
    it('テンプレートから展開したチケットを保存して取得できる', () => {
      // 1. テンプレートから展開
      const result = templateService.expandChildTickets({
        parentName: 'Webアプリ開発',
        parentDescription: '// 優先度高\n新規Webアプリケーションの開発',
        assignee: '山田太郎',
        startDate: new Date('2024-04-01'),
      });

      // 2. 展開結果を確認
      expect(result.parent.name).toBe('Webアプリ開発');
      expect(result.children).toHaveLength(5);

      // 親の終了日は最後の子チケットの終了日と同じ
      // リリース: 開始日+18 から 1日間 → 終了日 = 開始日+18
      expect(result.parent.endDate).toEqual(new Date('2024-04-19'));

      // 3. チケットを保存
      ticketService.saveTickets([result.parent, ...result.children]);

      // 4. 保存されたチケットを取得して確認
      const allTickets = ticketService.getAllTickets();
      expect(allTickets).toHaveLength(6); // 親1 + 子5

      // 5. 親チケットを取得
      const parents = ticketService.getParentTickets();
      expect(parents).toHaveLength(1);
      expect(parents[0].name).toBe('Webアプリ開発');

      // 6. 子チケットを取得
      const children = ticketService.getChildTickets(result.parent.id);
      expect(children).toHaveLength(5);

      // 7. 各子チケットの日程を確認
      const requirements = children.find(c => c.name === '要件定義');
      expect(requirements?.startDate).toEqual(new Date('2024-04-01'));
      expect(requirements?.endDate).toEqual(new Date('2024-04-03'));

      const design = children.find(c => c.name === '設計');
      expect(design?.startDate).toEqual(new Date('2024-04-04'));
      expect(design?.endDate).toEqual(new Date('2024-04-08'));

      const implementation = children.find(c => c.name === '実装');
      expect(implementation?.startDate).toEqual(new Date('2024-04-09'));
      expect(implementation?.endDate).toEqual(new Date('2024-04-15'));

      const testing = children.find(c => c.name === 'テスト');
      expect(testing?.startDate).toEqual(new Date('2024-04-16'));
      expect(testing?.endDate).toEqual(new Date('2024-04-18'));

      const release = children.find(c => c.name === 'リリース');
      expect(release?.startDate).toEqual(new Date('2024-04-19'));
      expect(release?.endDate).toEqual(new Date('2024-04-19'));
    });

    it('複数のプロジェクトを同時に管理できる', () => {
      // プロジェクト1を作成・保存
      const project1 = templateService.expandChildTickets({
        parentName: 'プロジェクトA',
        parentDescription: '',
        assignee: '山田太郎',
        startDate: new Date('2024-04-01'),
      });
      ticketService.saveTickets([project1.parent, ...project1.children]);

      // プロジェクト2を作成・保存
      const project2 = templateService.expandChildTickets({
        parentName: 'プロジェクトB',
        parentDescription: '',
        assignee: '鈴木花子',
        startDate: new Date('2024-04-15'),
      });
      ticketService.saveTickets([project2.parent, ...project2.children]);

      // 確認
      const allTickets = ticketService.getAllTickets();
      expect(allTickets).toHaveLength(12); // (親1 + 子5) × 2

      const parents = ticketService.getParentTickets();
      expect(parents).toHaveLength(2);

      // 各プロジェクトの子チケットを確認
      const project1Children = ticketService.getChildTickets(project1.parent.id);
      expect(project1Children).toHaveLength(5);
      expect(project1Children.every(c => c.assignee === '山田太郎')).toBe(true);

      const project2Children = ticketService.getChildTickets(project2.parent.id);
      expect(project2Children).toHaveLength(5);
      expect(project2Children.every(c => c.assignee === '鈴木花子')).toBe(true);
    });

    it('IDが連番で採番される', () => {
      // プロジェクト1
      const project1 = templateService.expandChildTickets({
        parentName: 'プロジェクト1',
        parentDescription: '',
        assignee: '山田太郎',
        startDate: new Date('2024-04-01'),
      });
      ticketService.saveTickets([project1.parent, ...project1.children]);

      // ID確認: T-001〜T-006
      expect(project1.parent.id).toBe('T-001');
      expect(project1.children.map(c => c.id)).toEqual([
        'T-002',
        'T-003',
        'T-004',
        'T-005',
        'T-006',
      ]);

      // プロジェクト2
      const project2 = templateService.expandChildTickets({
        parentName: 'プロジェクト2',
        parentDescription: '',
        assignee: '鈴木花子',
        startDate: new Date('2024-05-01'),
      });
      ticketService.saveTickets([project2.parent, ...project2.children]);

      // ID確認: T-007〜T-012
      expect(project2.parent.id).toBe('T-007');
      expect(project2.children.map(c => c.id)).toEqual([
        'T-008',
        'T-009',
        'T-010',
        'T-011',
        'T-012',
      ]);
    });
  });

  describe('期間による親チケット検索', () => {
    beforeEach(() => {
      // プロジェクト1: 4/1-4/19
      const project1 = templateService.expandChildTickets({
        parentName: 'プロジェクト1',
        parentDescription: '',
        assignee: '山田太郎',
        startDate: new Date('2024-04-01'),
      });
      ticketService.saveTickets([project1.parent, ...project1.children]);

      // プロジェクト2: 5/1-5/19
      const project2 = templateService.expandChildTickets({
        parentName: 'プロジェクト2',
        parentDescription: '',
        assignee: '鈴木花子',
        startDate: new Date('2024-05-01'),
      });
      ticketService.saveTickets([project2.parent, ...project2.children]);

      // プロジェクト3: 6/1-6/19
      const project3 = templateService.expandChildTickets({
        parentName: 'プロジェクト3',
        parentDescription: '',
        assignee: '田中一郎',
        startDate: new Date('2024-06-01'),
      });
      ticketService.saveTickets([project3.parent, ...project3.children]);
    });

    it('4月のみのチケットを取得できる', () => {
      const result = ticketService.getParentTicketsInPeriod(
        new Date('2024-04-01'),
        new Date('2024-04-30')
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('プロジェクト1');
    });

    it('4月〜5月のチケットを取得できる', () => {
      const result = ticketService.getParentTicketsInPeriod(
        new Date('2024-04-01'),
        new Date('2024-05-31')
      );

      expect(result).toHaveLength(2);
      expect(result.map(t => t.name).sort()).toEqual([
        'プロジェクト1',
        'プロジェクト2',
      ]);
    });

    it('全期間のチケットを取得できる', () => {
      const result = ticketService.getParentTicketsInPeriod(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      expect(result).toHaveLength(3);
    });

    it('期間外のチケットは取得されない', () => {
      const result = ticketService.getParentTicketsInPeriod(
        new Date('2024-07-01'),
        new Date('2024-07-31')
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('エラーハンドリング', () => {
    it('存在しない担当者でエラーになる', () => {
      expect(() =>
        templateService.expandChildTickets({
          parentName: 'テスト',
          parentDescription: '',
          assignee: '存在しない担当者',
          startDate: new Date('2024-04-01'),
        })
      ).toThrow('担当者 "存在しない担当者" が存在しません');
    });

    it('テンプレートがない場合はエラーになる', () => {
      // テンプレートを空にする
      mockSpreadsheet = new MockSpreadsheetWrapper();
      mockSpreadsheet.addSheet('テンプレート', [
        ['テンプレート名', '説明文', '開始日オフセット', '期間（日数）'],
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
      ]);
      mockSpreadsheet.addSheet('担当者リスト', [
        ['担当者名', 'メールアドレス'],
        ['山田太郎', 'yamada@example.com'],
      ]);

      const emptyTemplateRepo = new TemplateRepository(mockSpreadsheet);
      const emptyTicketRepo = new TicketRepository(mockSpreadsheet);
      const emptyAssigneeRepo = new AssigneeRepository(mockSpreadsheet);
      const emptyTemplateService = new TemplateService(
        emptyTemplateRepo,
        emptyTicketRepo,
        emptyAssigneeRepo
      );

      expect(() =>
        emptyTemplateService.expandChildTickets({
          parentName: 'テスト',
          parentDescription: '',
          assignee: '山田太郎',
          startDate: new Date('2024-04-01'),
        })
      ).toThrow('テンプレートが登録されていません');
    });
  });
});
