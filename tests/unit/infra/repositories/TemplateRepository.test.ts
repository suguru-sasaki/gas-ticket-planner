import { TemplateRepository } from '../../../../src/infra/repositories/TemplateRepository';
import { MockSpreadsheetWrapper } from '../../../helpers/MockSpreadsheet';

describe('TemplateRepository', () => {
  let mockSpreadsheet: MockSpreadsheetWrapper;
  let repository: TemplateRepository;

  const createTemplateSheet = (data: unknown[][] = []) => {
    const header = ['テンプレート名', '説明文', '開始日オフセット', '期間（日数）'];
    mockSpreadsheet.addSheet('テンプレート', [header, ...data]);
  };

  beforeEach(() => {
    mockSpreadsheet = new MockSpreadsheetWrapper();
  });

  describe('findAll', () => {
    it('テンプレートを取得できる', () => {
      createTemplateSheet([
        ['設計', '基本設計・詳細設計', 0, 3],
        ['実装', 'コーディング作業', 3, 5],
        ['テスト', '単体・結合テスト', 8, 2],
      ]);
      repository = new TemplateRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        name: '設計',
        description: '基本設計・詳細設計',
        startOffset: 0,
        duration: 3,
      });
      expect(result[1]).toEqual({
        name: '実装',
        description: 'コーディング作業',
        startOffset: 3,
        duration: 5,
      });
      expect(result[2]).toEqual({
        name: 'テスト',
        description: '単体・結合テスト',
        startOffset: 8,
        duration: 2,
      });
    });

    it('ヘッダのみの場合は空配列を返す', () => {
      createTemplateSheet();
      repository = new TemplateRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result).toHaveLength(0);
    });

    it('空行はスキップする', () => {
      createTemplateSheet([
        ['設計', '説明', 0, 3],
        ['', '', '', ''],
        ['実装', '説明', 3, 5],
      ]);
      repository = new TemplateRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result).toHaveLength(2);
    });

    it('説明が空でも取得できる', () => {
      createTemplateSheet([['設計', '', 0, 3]]);
      repository = new TemplateRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('');
    });

    it('オフセットが空の場合はデフォルト0を使用する', () => {
      createTemplateSheet([['設計', '説明', '', 3]]);
      repository = new TemplateRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result[0].startOffset).toBe(0);
    });

    it('期間が空の場合はデフォルト1を使用する', () => {
      createTemplateSheet([['設計', '説明', 0, '']]);
      repository = new TemplateRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result[0].duration).toBe(1);
    });

    it('オフセットが負の場合はエラーを投げる', () => {
      createTemplateSheet([['設計', '説明', -1, 3]]);
      repository = new TemplateRepository(mockSpreadsheet);

      expect(() => repository.findAll()).toThrow('開始日オフセットが不正');
    });

    it('期間が0以下の場合はエラーを投げる', () => {
      createTemplateSheet([['設計', '説明', 0, 0]]);
      repository = new TemplateRepository(mockSpreadsheet);

      expect(() => repository.findAll()).toThrow('期間が不正');
    });

    it('小数は切り捨てられる', () => {
      createTemplateSheet([['設計', '説明', 1.7, 3.9]]);
      repository = new TemplateRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result[0].startOffset).toBe(1);
      expect(result[0].duration).toBe(3);
    });
  });
});
