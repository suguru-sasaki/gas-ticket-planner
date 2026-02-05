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

  describe('isBusinessDay', () => {
    const holidays = [
      new Date('2024-01-01'), // 元日
      new Date('2024-01-08'), // 成人の日
    ];

    it('平日で祝日でない場合はtrueを返す', () => {
      // 2024-01-10 は水曜日
      expect(DateUtils.isBusinessDay(new Date('2024-01-10'), holidays)).toBe(true);
    });

    it('土曜日はfalseを返す', () => {
      // 2024-01-13 は土曜日
      expect(DateUtils.isBusinessDay(new Date('2024-01-13'), holidays)).toBe(false);
    });

    it('日曜日はfalseを返す', () => {
      // 2024-01-14 は日曜日
      expect(DateUtils.isBusinessDay(new Date('2024-01-14'), holidays)).toBe(false);
    });

    it('祝日はfalseを返す', () => {
      // 2024-01-01 は元日（月曜日）
      expect(DateUtils.isBusinessDay(new Date('2024-01-01'), holidays)).toBe(false);
    });

    it('平日の祝日はfalseを返す', () => {
      // 2024-01-08 は成人の日（月曜日）
      expect(DateUtils.isBusinessDay(new Date('2024-01-08'), holidays)).toBe(false);
    });

    it('祝日リストが空の場合は週末のみ判定する', () => {
      expect(DateUtils.isBusinessDay(new Date('2024-01-10'), [])).toBe(true); // 水曜日
      expect(DateUtils.isBusinessDay(new Date('2024-01-13'), [])).toBe(false); // 土曜日
    });
  });

  describe('addBusinessDays', () => {
    const holidays = [
      new Date('2024-01-08'), // 成人の日（月曜日）
    ];

    it('営業日を加算できる（週末をスキップ）', () => {
      // 2024-01-10 (水) + 3営業日 = 2024-01-15 (月)
      // 11(木), 12(金), [13土, 14日スキップ], 15(月)
      const result = DateUtils.addBusinessDays(new Date('2024-01-10'), 3, []);
      expect(result.getDate()).toBe(15);
    });

    it('営業日を加算できる（祝日をスキップ）', () => {
      // 2024-01-05 (金) + 2営業日 = 2024-01-10 (水)
      // [6土, 7日, 8祝スキップ], 9(火), 10(水)
      const result = DateUtils.addBusinessDays(new Date('2024-01-05'), 2, holidays);
      expect(result.getDate()).toBe(10);
    });

    it('0営業日を加算すると同じ日を返す', () => {
      const result = DateUtils.addBusinessDays(new Date('2024-01-10'), 0, []);
      expect(result.getDate()).toBe(10);
    });

    it('負の営業日数はエラーを投げる', () => {
      expect(() => DateUtils.addBusinessDays(new Date('2024-01-10'), -1, [])).toThrow(
        'businessDays must be non-negative'
      );
    });

    it('連続する祝日と週末をスキップする', () => {
      // 2024-01-05 (金) + 1営業日 = 2024-01-09 (火)
      // [6土, 7日, 8祝スキップ], 9(火)
      const result = DateUtils.addBusinessDays(new Date('2024-01-05'), 1, holidays);
      expect(result.getDate()).toBe(9);
    });
  });

  describe('getEndDateByBusinessDays', () => {
    const holidays = [
      new Date('2024-01-08'), // 成人の日（月曜日）
    ];

    it('開始日が営業日の場合、開始日を1日目としてカウントする', () => {
      // 2024-01-10 (水) から3営業日 = 2024-01-12 (金)
      // 10(水)=1日目, 11(木)=2日目, 12(金)=3日目
      const result = DateUtils.getEndDateByBusinessDays(new Date('2024-01-10'), 3, []);
      expect(result.getDate()).toBe(12);
    });

    it('1営業日の場合は開始日を返す', () => {
      const result = DateUtils.getEndDateByBusinessDays(new Date('2024-01-10'), 1, []);
      expect(result.getDate()).toBe(10);
    });

    it('週末を跨ぐ場合は週末をスキップする', () => {
      // 2024-01-12 (金) から3営業日 = 2024-01-16 (火)
      // 12(金)=1日目, [13土, 14日スキップ], 15(月)=2日目, 16(火)=3日目
      const result = DateUtils.getEndDateByBusinessDays(new Date('2024-01-12'), 3, []);
      expect(result.getDate()).toBe(16);
    });

    it('祝日をスキップする', () => {
      // 2024-01-05 (金) から3営業日 = 2024-01-10 (水)
      // 5(金)=1日目, [6土, 7日, 8祝スキップ], 9(火)=2日目, 10(水)=3日目
      const result = DateUtils.getEndDateByBusinessDays(new Date('2024-01-05'), 3, holidays);
      expect(result.getDate()).toBe(10);
    });

    it('開始日が週末の場合は次の営業日から開始する', () => {
      // 2024-01-13 (土) から2営業日 = 2024-01-16 (火)
      // [13土スキップ], 15(月)=1日目, 16(火)=2日目
      const result = DateUtils.getEndDateByBusinessDays(new Date('2024-01-13'), 2, []);
      expect(result.getDate()).toBe(16);
    });

    it('開始日が祝日の場合は次の営業日から開始する', () => {
      // 2024-01-08 (祝) から2営業日 = 2024-01-10 (水)
      // [8祝スキップ], 9(火)=1日目, 10(水)=2日目
      const result = DateUtils.getEndDateByBusinessDays(new Date('2024-01-08'), 2, holidays);
      expect(result.getDate()).toBe(10);
    });

    it('0営業日以下はエラーを投げる', () => {
      expect(() => DateUtils.getEndDateByBusinessDays(new Date('2024-01-10'), 0, [])).toThrow(
        'durationBusinessDays must be at least 1'
      );
    });
  });
});
