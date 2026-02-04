import { AssigneeRepository } from '../../../../src/infra/repositories/AssigneeRepository';
import { MockSpreadsheetWrapper } from '../../../helpers/MockSpreadsheet';

describe('AssigneeRepository', () => {
  let mockSpreadsheet: MockSpreadsheetWrapper;
  let repository: AssigneeRepository;

  beforeEach(() => {
    mockSpreadsheet = new MockSpreadsheetWrapper();
  });

  describe('findAll', () => {
    it('担当者リストを取得できる', () => {
      mockSpreadsheet.addSheet('担当者リスト', [
        ['担当者名', 'メールアドレス'],
        ['山田太郎', 'yamada@example.com'],
        ['鈴木花子', 'suzuki@example.com'],
      ]);
      repository = new AssigneeRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: '山田太郎', email: 'yamada@example.com' });
      expect(result[1]).toEqual({ name: '鈴木花子', email: 'suzuki@example.com' });
    });

    it('ヘッダのみの場合は空配列を返す', () => {
      mockSpreadsheet.addSheet('担当者リスト', [['担当者名', 'メールアドレス']]);
      repository = new AssigneeRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result).toHaveLength(0);
    });

    it('空行はスキップする', () => {
      mockSpreadsheet.addSheet('担当者リスト', [
        ['担当者名', 'メールアドレス'],
        ['山田太郎', 'yamada@example.com'],
        ['', ''],
        ['鈴木花子', 'suzuki@example.com'],
      ]);
      repository = new AssigneeRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result).toHaveLength(2);
    });

    it('メールアドレスが空でも取得できる', () => {
      mockSpreadsheet.addSheet('担当者リスト', [
        ['担当者名', 'メールアドレス'],
        ['山田太郎', ''],
      ]);
      repository = new AssigneeRepository(mockSpreadsheet);

      const result = repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('');
    });
  });

  describe('findByName', () => {
    beforeEach(() => {
      mockSpreadsheet.addSheet('担当者リスト', [
        ['担当者名', 'メールアドレス'],
        ['山田太郎', 'yamada@example.com'],
        ['鈴木花子', 'suzuki@example.com'],
      ]);
      repository = new AssigneeRepository(mockSpreadsheet);
    });

    it('名前で担当者を検索できる', () => {
      const result = repository.findByName('山田太郎');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('山田太郎');
      expect(result?.email).toBe('yamada@example.com');
    });

    it('存在しない名前はnullを返す', () => {
      const result = repository.findByName('存在しない');

      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    beforeEach(() => {
      mockSpreadsheet.addSheet('担当者リスト', [
        ['担当者名', 'メールアドレス'],
        ['山田太郎', 'yamada@example.com'],
      ]);
      repository = new AssigneeRepository(mockSpreadsheet);
    });

    it('存在する担当者はtrueを返す', () => {
      expect(repository.exists('山田太郎')).toBe(true);
    });

    it('存在しない担当者はfalseを返す', () => {
      expect(repository.exists('存在しない')).toBe(false);
    });
  });

  describe('ensureNotEmpty', () => {
    it('担当者がいる場合はエラーを投げない', () => {
      mockSpreadsheet.addSheet('担当者リスト', [
        ['担当者名', 'メールアドレス'],
        ['山田太郎', 'yamada@example.com'],
      ]);
      repository = new AssigneeRepository(mockSpreadsheet);

      expect(() => repository.ensureNotEmpty()).not.toThrow();
    });

    it('担当者がいない場合はエラーを投げる', () => {
      mockSpreadsheet.addSheet('担当者リスト', [['担当者名', 'メールアドレス']]);
      repository = new AssigneeRepository(mockSpreadsheet);

      expect(() => repository.ensureNotEmpty()).toThrow('担当者リストが空です');
    });
  });
});
