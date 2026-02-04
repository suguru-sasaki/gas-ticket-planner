import { Validator } from '../../../../src/domain/utils/Validator';
import { AppError } from '../../../../src/errors/AppError';

describe('Validator', () => {
  describe('validateTicketName', () => {
    it('有効なチケット名を検証できる', () => {
      expect(() => Validator.validateTicketName('テストチケット')).not.toThrow();
      expect(() => Validator.validateTicketName('A')).not.toThrow();
    });

    it('空のチケット名はエラーを投げる', () => {
      expect(() => Validator.validateTicketName('')).toThrow(AppError);
      expect(() => Validator.validateTicketName('   ')).toThrow(AppError);
    });

    it('100文字を超えるチケット名はエラーを投げる', () => {
      const longName = 'あ'.repeat(101);
      expect(() => Validator.validateTicketName(longName)).toThrow(AppError);
    });

    it('100文字ちょうどのチケット名は有効', () => {
      const exactName = 'あ'.repeat(100);
      expect(() => Validator.validateTicketName(exactName)).not.toThrow();
    });
  });

  describe('validateDescription', () => {
    it('有効な説明文を検証できる', () => {
      expect(() => Validator.validateDescription('説明文')).not.toThrow();
      expect(() => Validator.validateDescription('')).not.toThrow();
    });

    it('1000文字を超える説明文はエラーを投げる', () => {
      const longDesc = 'あ'.repeat(1001);
      expect(() => Validator.validateDescription(longDesc)).toThrow(AppError);
    });

    it('1000文字ちょうどの説明文は有効', () => {
      const exactDesc = 'あ'.repeat(1000);
      expect(() => Validator.validateDescription(exactDesc)).not.toThrow();
    });
  });

  describe('validateDate', () => {
    it('Dateオブジェクトを検証できる', () => {
      const date = new Date('2026-04-01');
      const result = Validator.validateDate(date);
      expect(result).toEqual(date);
    });

    it('日付文字列をパースできる', () => {
      const result = Validator.validateDate('2026-04-01');
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // 0-indexed
      expect(result.getDate()).toBe(1);
    });

    it('無効なDateオブジェクトはエラーを投げる', () => {
      const invalidDate = new Date('invalid');
      expect(() => Validator.validateDate(invalidDate)).toThrow(AppError);
    });

    it('無効な日付文字列はエラーを投げる', () => {
      expect(() => Validator.validateDate('invalid-date')).toThrow(AppError);
    });

    it('非日付値はエラーを投げる', () => {
      expect(() => Validator.validateDate(123)).toThrow(AppError);
      expect(() => Validator.validateDate(null)).toThrow(AppError);
      expect(() => Validator.validateDate(undefined)).toThrow(AppError);
    });
  });

  describe('validateDateRange', () => {
    it('有効な日付範囲を検証できる', () => {
      const start = new Date('2026-04-01');
      const end = new Date('2026-04-10');
      expect(() => Validator.validateDateRange(start, end)).not.toThrow();
    });

    it('同じ日付の範囲は有効', () => {
      const date = new Date('2026-04-01');
      expect(() => Validator.validateDateRange(date, date)).not.toThrow();
    });

    it('開始日が終了日より後の場合はエラーを投げる', () => {
      const start = new Date('2026-04-10');
      const end = new Date('2026-04-01');
      expect(() => Validator.validateDateRange(start, end)).toThrow(AppError);
    });
  });

  describe('validateColorCode', () => {
    it('有効なHEXカラーコードを検証できる', () => {
      expect(() => Validator.validateColorCode('#FFFFFF')).not.toThrow();
      expect(() => Validator.validateColorCode('#000000')).not.toThrow();
      expect(() => Validator.validateColorCode('#4285F4')).not.toThrow();
      expect(() => Validator.validateColorCode('#aabbcc')).not.toThrow();
    });

    it('無効なカラーコードはエラーを投げる', () => {
      expect(() => Validator.validateColorCode('FFFFFF')).toThrow(AppError); // #なし
      expect(() => Validator.validateColorCode('#FFF')).toThrow(AppError); // 短縮形
      expect(() => Validator.validateColorCode('#GGGGGG')).toThrow(AppError); // 無効な文字
      expect(() => Validator.validateColorCode('')).toThrow(AppError);
    });
  });

  describe('isValidEmail', () => {
    it('有効なメールアドレスを判定できる', () => {
      expect(Validator.isValidEmail('test@example.com')).toBe(true);
      expect(Validator.isValidEmail('user.name@domain.co.jp')).toBe(true);
      expect(Validator.isValidEmail('a@b.c')).toBe(true);
    });

    it('無効なメールアドレスを判定できる', () => {
      expect(Validator.isValidEmail('')).toBe(false);
      expect(Validator.isValidEmail('invalid')).toBe(false);
      expect(Validator.isValidEmail('no@domain')).toBe(false);
      expect(Validator.isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('validateInteger', () => {
    it('有効な整数を検証できる', () => {
      expect(Validator.validateInteger(5, 0)).toBe(5);
      expect(Validator.validateInteger(0, 0)).toBe(0);
      expect(Validator.validateInteger('10', 0)).toBe(10);
    });

    it('最小値未満の場合はエラーを投げる', () => {
      expect(() => Validator.validateInteger(-1, 0)).toThrow(AppError);
      expect(() => Validator.validateInteger(4, 5)).toThrow(AppError);
    });

    it('最大値を超える場合はエラーを投げる', () => {
      expect(() => Validator.validateInteger(11, 0, 10)).toThrow(AppError);
    });

    it('整数でない場合はエラーを投げる', () => {
      expect(() => Validator.validateInteger(3.14, 0)).toThrow(AppError);
      expect(() => Validator.validateInteger('abc', 0)).toThrow(AppError);
      expect(() => Validator.validateInteger(null, 0)).toThrow(AppError);
    });
  });

  describe('validateRequiredString', () => {
    it('有効な文字列を検証できる', () => {
      expect(Validator.validateRequiredString('test', 'フィールド')).toBe('test');
      expect(Validator.validateRequiredString('  trimmed  ', 'フィールド')).toBe('trimmed');
    });

    it('空の文字列はエラーを投げる', () => {
      expect(() => Validator.validateRequiredString('', 'フィールド')).toThrow(AppError);
      expect(() => Validator.validateRequiredString('   ', 'フィールド')).toThrow(AppError);
    });

    it('文字列以外はエラーを投げる', () => {
      expect(() => Validator.validateRequiredString(null, 'フィールド')).toThrow(AppError);
      expect(() => Validator.validateRequiredString(123, 'フィールド')).toThrow(AppError);
    });
  });
});
