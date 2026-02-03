import { IdGenerator } from '../../../../src/domain/utils/IdGenerator';

describe('IdGenerator', () => {
  describe('generateTicketId', () => {
    it('空配列の場合はT-001を返す', () => {
      expect(IdGenerator.generateTicketId([])).toBe('T-001');
    });

    it('既存IDの次の番号を返す', () => {
      expect(IdGenerator.generateTicketId(['T-001'])).toBe('T-002');
    });

    it('複数の既存IDがある場合は最大値の次を返す', () => {
      expect(IdGenerator.generateTicketId(['T-001', 'T-005', 'T-003'])).toBe(
        'T-006'
      );
    });

    it('999を超えても正しく採番する', () => {
      expect(IdGenerator.generateTicketId(['T-999'])).toBe('T-1000');
    });

    it('桁数が不揃いでも正しく処理する', () => {
      expect(IdGenerator.generateTicketId(['T-1', 'T-02', 'T-003'])).toBe(
        'T-004'
      );
    });

    it('連続していないIDでも最大値を見つける', () => {
      expect(IdGenerator.generateTicketId(['T-001', 'T-100', 'T-050'])).toBe(
        'T-101'
      );
    });

    it('不正なIDは無視する', () => {
      expect(
        IdGenerator.generateTicketId(['T-001', 'invalid', 'T-003'])
      ).toBe('T-004');
    });
  });

  describe('extractNumber', () => {
    it('T-001から1を抽出する', () => {
      expect(IdGenerator.extractNumber('T-001')).toBe(1);
    });

    it('T-999から999を抽出する', () => {
      expect(IdGenerator.extractNumber('T-999')).toBe(999);
    });

    it('T-1000から1000を抽出する', () => {
      expect(IdGenerator.extractNumber('T-1000')).toBe(1000);
    });

    it('T-1から1を抽出する（パディングなし）', () => {
      expect(IdGenerator.extractNumber('T-1')).toBe(1);
    });

    it('無効な形式はNaNを返す', () => {
      expect(IdGenerator.extractNumber('invalid')).toBeNaN();
    });

    it('プレフィックスがない場合はNaNを返す', () => {
      expect(IdGenerator.extractNumber('001')).toBeNaN();
    });

    it('空文字はNaNを返す', () => {
      expect(IdGenerator.extractNumber('')).toBeNaN();
    });

    it('数値部分が不正な場合はNaNを返す', () => {
      expect(IdGenerator.extractNumber('T-abc')).toBeNaN();
    });
  });

  describe('isValidId', () => {
    it('T-001は有効', () => {
      expect(IdGenerator.isValidId('T-001')).toBe(true);
    });

    it('T-1は有効', () => {
      expect(IdGenerator.isValidId('T-1')).toBe(true);
    });

    it('T-1000は有効', () => {
      expect(IdGenerator.isValidId('T-1000')).toBe(true);
    });

    it('T-0は無効（0は許可しない）', () => {
      expect(IdGenerator.isValidId('T-0')).toBe(false);
    });

    it('T-は無効', () => {
      expect(IdGenerator.isValidId('T-')).toBe(false);
    });

    it('空文字は無効', () => {
      expect(IdGenerator.isValidId('')).toBe(false);
    });

    it('プレフィックスなしは無効', () => {
      expect(IdGenerator.isValidId('001')).toBe(false);
    });

    it('異なるプレフィックスは無効', () => {
      expect(IdGenerator.isValidId('X-001')).toBe(false);
    });

    it('T-abcは無効', () => {
      expect(IdGenerator.isValidId('T-abc')).toBe(false);
    });
  });
});
