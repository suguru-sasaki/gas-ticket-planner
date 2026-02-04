/**
 * 統合テスト: ガント生成フロー
 * チケット読み込み → ガントデータ生成 → 背景色設定の一連の流れをテスト
 */
import { TemplateService } from '../../src/domain/services/TemplateService';
import { TicketService } from '../../src/domain/services/TicketService';
import { GanttService } from '../../src/domain/services/GanttService';
import { TemplateRepository } from '../../src/infra/repositories/TemplateRepository';
import { TicketRepository } from '../../src/infra/repositories/TicketRepository';
import { AssigneeRepository } from '../../src/infra/repositories/AssigneeRepository';
import { SettingsRepository } from '../../src/infra/repositories/SettingsRepository';
import { MockSpreadsheetWrapper } from '../helpers/MockSpreadsheet';

describe('統合テスト: ガント生成フロー', () => {
  let mockSpreadsheet: MockSpreadsheetWrapper;
  let templateRepository: TemplateRepository;
  let ticketRepository: TicketRepository;
  let assigneeRepository: AssigneeRepository;
  let settingsRepository: SettingsRepository;
  let templateService: TemplateService;
  let ticketService: TicketService;
  let ganttService: GanttService;

  const setupSheets = () => {
    // テンプレートシート
    mockSpreadsheet.addSheet('テンプレート', [
      ['テンプレート名', '説明文', '開始日オフセット', '期間（日数）'],
      ['設計', '// 設計フェーズ\n基本設計・詳細設計', 0, 3],
      ['実装', 'コーディング作業', 3, 5],
      ['テスト', '// QA確認必須\n単体・結合テスト', 8, 2],
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
    ]);

    // 可視化設定シート
    mockSpreadsheet.addSheet('可視化設定', [
      ['設定名', '設定値'],
      ['親チケット色', '#4285F4'],
      ['子チケット色_未着手', '#E0E0E0'],
      ['子チケット色_進行中', '#FFC107'],
      ['子チケット色_完了', '#4CAF50'],
      ['今日の日付色', '#FFEB3B'],
      ['週末色', '#F5F5F5'],
    ]);

    templateRepository = new TemplateRepository(mockSpreadsheet);
    ticketRepository = new TicketRepository(mockSpreadsheet);
    assigneeRepository = new AssigneeRepository(mockSpreadsheet);
    settingsRepository = new SettingsRepository(mockSpreadsheet);

    templateService = new TemplateService(
      templateRepository,
      ticketRepository,
      assigneeRepository
    );
    ticketService = new TicketService(ticketRepository, assigneeRepository);
    ganttService = new GanttService(ticketRepository, settingsRepository);
  };

  beforeEach(() => {
    mockSpreadsheet = new MockSpreadsheetWrapper();
    setupSheets();
  });

  describe('チケット作成→ガント生成', () => {
    it('作成したチケットからガントを生成できる', () => {
      // 1. チケットを作成・保存
      const project = templateService.expandChildTickets({
        parentName: '機能A開発',
        parentDescription: '// 重要案件\n新機能の開発',
        assignee: '山田太郎',
        startDate: new Date('2024-04-01'),
      });
      ticketService.saveTickets([project.parent, ...project.children]);

      // 2. ガントを生成
      const gantt = ganttService.generateGantt({
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-10'),
      });

      // 3. ヘッダを確認
      expect(gantt.headers).toHaveLength(17); // 固定7列 + 日付10列
      expect(gantt.headers.slice(0, 7)).toEqual([
        '親チケット名',
        '子チケット名',
        'メモ',
        '担当者',
        '状態',
        '開始日',
        '終了日',
      ]);

      // 4. 行数を確認（親1 + 子3 = 4行）
      expect(gantt.rows).toHaveLength(4);

      // 5. 親チケット行を確認
      const parentRow = gantt.rows[0];
      expect(parentRow.parentName).toBe('機能A開発');
      expect(parentRow.childName).toBe('');
      expect(parentRow.memo).toBe('重要案件');
      expect(parentRow.assignee).toBe('山田太郎');
      expect(parentRow.status).toBe('未着手');

      // 6. 子チケット行を確認
      const designRow = gantt.rows[1];
      expect(designRow.parentName).toBe('機能A開発');
      expect(designRow.childName).toBe('設計');
      expect(designRow.memo).toBe('設計フェーズ');

      const implRow = gantt.rows[2];
      expect(implRow.childName).toBe('実装');
      expect(implRow.memo).toBe('');

      const testRow = gantt.rows[3];
      expect(testRow.childName).toBe('テスト');
      expect(testRow.memo).toBe('QA確認必須');
    });

    it('背景色が正しく設定される', () => {
      // チケットを作成・保存
      const project = templateService.expandChildTickets({
        parentName: '機能A開発',
        parentDescription: '',
        assignee: '山田太郎',
        startDate: new Date('2024-04-01'),
      });
      ticketService.saveTickets([project.parent, ...project.children]);

      // ガントを生成
      const gantt = ganttService.generateGantt({
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-10'),
      });

      // 背景色配列を確認
      expect(gantt.backgrounds).toHaveLength(4);

      // 親チケットの背景色（4/1〜4/9が親の期間）
      const parentBg = gantt.backgrounds[0];
      expect(parentBg).toHaveLength(17); // 固定7列 + 日付10列

      // 固定列は白
      expect(parentBg.slice(0, 7).every(c => c === '#FFFFFF')).toBe(true);

      // 日付列（親チケットは4/1-4/9なので、インデックス7〜15が色付き）
      expect(parentBg[7]).toBe('#4285F4'); // 4/1
      expect(parentBg[8]).toBe('#4285F4'); // 4/2
      expect(parentBg[9]).toBe('#4285F4'); // 4/3

      // 子チケット（設計 4/1-4/3）の背景色
      const designBg = gantt.backgrounds[1];
      expect(designBg[7]).toBe('#E0E0E0'); // 4/1 未着手
      expect(designBg[8]).toBe('#E0E0E0'); // 4/2
      expect(designBg[9]).toBe('#E0E0E0'); // 4/3

      // 4/4以降は設計期間外
      expect(designBg[10]).not.toBe('#E0E0E0');
    });

    it('複数プロジェクトのガントを生成できる', () => {
      // プロジェクト1
      const project1 = templateService.expandChildTickets({
        parentName: 'プロジェクト1',
        parentDescription: '',
        assignee: '山田太郎',
        startDate: new Date('2024-04-01'),
      });
      ticketService.saveTickets([project1.parent, ...project1.children]);

      // プロジェクト2
      const project2 = templateService.expandChildTickets({
        parentName: 'プロジェクト2',
        parentDescription: '',
        assignee: '鈴木花子',
        startDate: new Date('2024-04-05'),
      });
      ticketService.saveTickets([project2.parent, ...project2.children]);

      // ガント生成
      const gantt = ganttService.generateGantt({
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-15'),
      });

      // 両プロジェクトが含まれる（親2 + 子6 = 8行）
      expect(gantt.rows).toHaveLength(8);

      // プロジェクト1の行
      expect(gantt.rows[0].parentName).toBe('プロジェクト1');
      expect(gantt.rows[1].childName).toBe('設計');
      expect(gantt.rows[2].childName).toBe('実装');
      expect(gantt.rows[3].childName).toBe('テスト');

      // プロジェクト2の行
      expect(gantt.rows[4].parentName).toBe('プロジェクト2');
      expect(gantt.rows[5].childName).toBe('設計');
      expect(gantt.rows[6].childName).toBe('実装');
      expect(gantt.rows[7].childName).toBe('テスト');
    });
  });

  describe('期間フィルタリング', () => {
    beforeEach(() => {
      // 4月開始のプロジェクト
      const project1 = templateService.expandChildTickets({
        parentName: '4月プロジェクト',
        parentDescription: '',
        assignee: '山田太郎',
        startDate: new Date('2024-04-01'),
      });
      ticketService.saveTickets([project1.parent, ...project1.children]);

      // 5月開始のプロジェクト
      const project2 = templateService.expandChildTickets({
        parentName: '5月プロジェクト',
        parentDescription: '',
        assignee: '鈴木花子',
        startDate: new Date('2024-05-01'),
      });
      ticketService.saveTickets([project2.parent, ...project2.children]);
    });

    it('4月のみのガントを生成できる', () => {
      const gantt = ganttService.generateGantt({
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      });

      // 4月プロジェクトのみ（親1 + 子3 = 4行）
      expect(gantt.rows).toHaveLength(4);
      expect(gantt.rows[0].parentName).toBe('4月プロジェクト');
    });

    it('5月のみのガントを生成できる', () => {
      const gantt = ganttService.generateGantt({
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-05-31'),
      });

      // 5月プロジェクトのみ（親1 + 子3 = 4行）
      expect(gantt.rows).toHaveLength(4);
      expect(gantt.rows[0].parentName).toBe('5月プロジェクト');
    });

    it('4月〜5月のガントを生成できる', () => {
      const gantt = ganttService.generateGantt({
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-05-31'),
      });

      // 両プロジェクト（親2 + 子6 = 8行）
      expect(gantt.rows).toHaveLength(8);
    });

    it('該当なしの期間は空のガントを返す', () => {
      const gantt = ganttService.generateGantt({
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
      });

      expect(gantt.rows).toHaveLength(0);
    });
  });

  describe('GanttRowモデルの生成', () => {
    it('GanttRow配列を生成できる', () => {
      const project = templateService.expandChildTickets({
        parentName: '機能A開発',
        parentDescription: '// メモ\n説明',
        assignee: '山田太郎',
        startDate: new Date('2024-04-01'),
      });
      ticketService.saveTickets([project.parent, ...project.children]);

      const rows = ganttService.generateGanttRows(
        new Date('2024-04-01'),
        new Date('2024-04-10')
      );

      expect(rows).toHaveLength(4);

      // 各行のプロパティを確認
      const parentRow = rows[0];
      expect(parentRow.parentName).toBe('機能A開発');
      expect(parentRow.childName).toBe('');
      expect(parentRow.memo).toBe('メモ');
      expect(parentRow.assignee).toBe('山田太郎');
      expect(parentRow.status).toBe('未着手');
      expect(parentRow.dateCells).toHaveLength(10);
      expect(parentRow.backgroundColors).toHaveLength(17);
    });
  });
});
