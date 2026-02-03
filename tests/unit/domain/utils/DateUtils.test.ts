import { DateUtils } from '../../../../src/domain/utils/DateUtils';

describe('DateUtils', () => {
  describe('addDays', () => {
    it('正の日数を加算できる', () => {
      const base = new Date('2024-01-10');
      const result = DateUtils.addDays(base, 5);
      expect(result).toEqual(new Date('2024-01-15'));
    });

    it('負の日数を加算（減算）できる', () => {
      const base = new Date('2024-01-10');
      const result = DateUtils.addDays(base, -3);
      expect(result).toEqual(new Date('2024-01-07'));
    });

    it('月跨ぎを正しく処理できる', () => {
      const base = new Date('2024-01-30');
      const result = DateUtils.addDays(base, 5);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(4);
    });

    it('年跨ぎを正しく処理できる', () => {
      const base = new Date('2024-12-30');
      const result = DateUtils.addDays(base, 5);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(4);
    });

    it('閏年の2月29日を正しく処理できる', () => {
      const base = new Date('2024-02-28');
      const result = DateUtils.addDays(base, 1);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29);
    });

    it('元の日付を変更しない', () => {
      const base = new Date('2024-01-10');
      const originalTime = base.getTime();
      DateUtils.addDays(base, 5);
      expect(base.getTime()).toBe(originalTime);
    });
  });

  describe('daysBetween', () => {
    it('同日の場合は1を返す（開始日を含む）', () => {
      const result = DateUtils.daysBetween(
        new Date('2024-01-10'),
        new Date('2024-01-10')
      );
      expect(result).toBe(1);
    });

    it('連続する2日間は2を返す', () => {
      const result = DateUtils.daysBetween(
        new Date('2024-01-10'),
        new Date('2024-01-11')
      );
      expect(result).toBe(2);
    });

    it('1週間は7を返す', () => {
      const result = DateUtils.daysBetween(
        new Date('2024-01-10'),
        new Date('2024-01-16')
      );
      expect(result).toBe(7);
    });

    it('月跨ぎでも正しく計算する', () => {
      const result = DateUtils.daysBetween(
        new Date('2024-01-30'),
        new Date('2024-02-02')
      );
      expect(result).toBe(4); // 30, 31, 1, 2
    });
  });

  describe('generateDateRange', () => {
    it('開始日から終了日までの日付配列を生成する', () => {
      const result = DateUtils.generateDateRange(
        new Date('2024-01-10'),
        new Date('2024-01-12')
      );
      expect(result).toHaveLength(3);
      expect(result[0].getDate()).toBe(10);
      expect(result[1].getDate()).toBe(11);
      expect(result[2].getDate()).toBe(12);
    });

    it('同日の場合は1要素の配列を返す', () => {
      const result = DateUtils.generateDateRange(
        new Date('2024-01-10'),
        new Date('2024-01-10')
      );
      expect(result).toHaveLength(1);
      expect(result[0].getDate()).toBe(10);
    });

    it('月跨ぎでも正しく生成する', () => {
      const result = DateUtils.generateDateRange(
        new Date('2024-01-30'),
        new Date('2024-02-02')
      );
      expect(result).toHaveLength(4);
      expect(result[0].getDate()).toBe(30);
      expect(result[1].getDate()).toBe(31);
      expect(result[2].getDate()).toBe(1);
      expect(result[3].getDate()).toBe(2);
    });
  });

  describe('getDayOfWeek', () => {
    it('日曜日を正しく返す', () => {
      expect(DateUtils.getDayOfWeek(new Date('2024-01-07'))).toBe('日');
    });

    it('月曜日を正しく返す', () => {
      expect(DateUtils.getDayOfWeek(new Date('2024-01-08'))).toBe('月');
    });

    it('火曜日を正しく返す', () => {
      expect(DateUtils.getDayOfWeek(new Date('2024-01-09'))).toBe('火');
    });

    it('水曜日を正しく返す', () => {
      expect(DateUtils.getDayOfWeek(new Date('2024-01-10'))).toBe('水');
    });

    it('木曜日を正しく返す', () => {
      expect(DateUtils.getDayOfWeek(new Date('2024-01-11'))).toBe('木');
    });

    it('金曜日を正しく返す', () => {
      expect(DateUtils.getDayOfWeek(new Date('2024-01-12'))).toBe('金');
    });

    it('土曜日を正しく返す', () => {
      expect(DateUtils.getDayOfWeek(new Date('2024-01-13'))).toBe('土');
    });
  });

  describe('isWeekend', () => {
    it('土曜日はtrueを返す', () => {
      expect(DateUtils.isWeekend(new Date('2024-01-13'))).toBe(true);
    });

    it('日曜日はtrueを返す', () => {
      expect(DateUtils.isWeekend(new Date('2024-01-14'))).toBe(true);
    });

    it('月曜日はfalseを返す', () => {
      expect(DateUtils.isWeekend(new Date('2024-01-08'))).toBe(false);
    });

    it('水曜日はfalseを返す', () => {
      expect(DateUtils.isWeekend(new Date('2024-01-10'))).toBe(false);
    });

    it('金曜日はfalseを返す', () => {
      expect(DateUtils.isWeekend(new Date('2024-01-12'))).toBe(false);
    });
  });

  describe('isOverlapping', () => {
    it('完全に含まれる場合はtrueを返す', () => {
      expect(
        DateUtils.isOverlapping(
          new Date('2024-01-01'),
          new Date('2024-01-31'),
          new Date('2024-01-10'),
          new Date('2024-01-20')
        )
      ).toBe(true);
    });

    it('部分的に重なる場合（前方）はtrueを返す', () => {
      expect(
        DateUtils.isOverlapping(
          new Date('2024-01-10'),
          new Date('2024-01-20'),
          new Date('2024-01-15'),
          new Date('2024-01-25')
        )
      ).toBe(true);
    });

    it('部分的に重なる場合（後方）はtrueを返す', () => {
      expect(
        DateUtils.isOverlapping(
          new Date('2024-01-15'),
          new Date('2024-01-25'),
          new Date('2024-01-10'),
          new Date('2024-01-20')
        )
      ).toBe(true);
    });

    it('境界で接する場合はtrueを返す', () => {
      expect(
        DateUtils.isOverlapping(
          new Date('2024-01-10'),
          new Date('2024-01-15'),
          new Date('2024-01-15'),
          new Date('2024-01-20')
        )
      ).toBe(true);
    });

    it('完全に離れている場合（前）はfalseを返す', () => {
      expect(
        DateUtils.isOverlapping(
          new Date('2024-01-01'),
          new Date('2024-01-10'),
          new Date('2024-01-20'),
          new Date('2024-01-31')
        )
      ).toBe(false);
    });

    it('完全に離れている場合（後）はfalseを返す', () => {
      expect(
        DateUtils.isOverlapping(
          new Date('2024-01-20'),
          new Date('2024-01-31'),
          new Date('2024-01-01'),
          new Date('2024-01-10')
        )
      ).toBe(false);
    });
  });

  describe('format', () => {
    it('M/D形式でフォーマットできる', () => {
      expect(DateUtils.format(new Date('2024-01-05'), 'M/D')).toBe('1/5');
    });

    it('MM/DD形式でフォーマットできる', () => {
      expect(DateUtils.format(new Date('2024-01-05'), 'MM/DD')).toBe('01/05');
    });

    it('YYYY/MM/DD形式でフォーマットできる', () => {
      expect(DateUtils.format(new Date('2024-01-05'), 'YYYY/MM/DD')).toBe(
        '2024/01/05'
      );
    });

    it('曜日を含むフォーマットができる', () => {
      expect(DateUtils.format(new Date('2024-01-10'), 'M/D (ddd)')).toBe(
        '1/10 (水)'
      );
    });
  });

  describe('stripTime', () => {
    it('時刻部分を0:00:00に設定する', () => {
      const date = new Date('2024-01-10T15:30:45.123');
      const result = DateUtils.stripTime(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('元の日付を変更しない', () => {
      const date = new Date('2024-01-10T15:30:45.123');
      const originalHours = date.getHours();
      DateUtils.stripTime(date);
      expect(date.getHours()).toBe(originalHours);
    });
  });

  describe('isValidDate', () => {
    it('有効なDateオブジェクトはtrueを返す', () => {
      expect(DateUtils.isValidDate(new Date('2024-01-10'))).toBe(true);
    });

    it('Invalid Dateはfalseを返す', () => {
      expect(DateUtils.isValidDate(new Date('invalid'))).toBe(false);
    });

    it('nullはfalseを返す', () => {
      expect(DateUtils.isValidDate(null)).toBe(false);
    });

    it('undefinedはfalseを返す', () => {
      expect(DateUtils.isValidDate(undefined)).toBe(false);
    });

    it('文字列はfalseを返す', () => {
      expect(DateUtils.isValidDate('2024-01-10')).toBe(false);
    });
  });

  describe('parseDate', () => {
    it('ISO形式の文字列をパースできる', () => {
      const result = DateUtils.parseDate('2024-01-10');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(10);
    });

    it('無効な文字列はエラーを投げる', () => {
      expect(() => DateUtils.parseDate('invalid')).toThrow();
    });
  });
});
