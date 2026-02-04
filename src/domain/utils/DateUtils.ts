/**
 * 日付計算ユーティリティ
 */
export class DateUtils {
  private static readonly DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

  /**
   * 基準日に日数を加算
   * @param baseDate 基準日
   * @param days 加算日数（負も可）
   * @returns 加算後の日付
   */
  static addDays(baseDate: Date, days: number): Date {
    const result = new Date(baseDate);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * 2つの日付間の日数を計算（開始日を含む）
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 日数
   */
  static daysBetween(startDate: Date, endDate: Date): number {
    const start = this.stripTime(startDate);
    const end = this.stripTime(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // 開始日を含むため+1
  }

  /**
   * 開始日から終了日までの日付配列を生成
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 日付の配列
   */
  static generateDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const current = this.stripTime(startDate);
    const end = this.stripTime(endDate);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * 曜日を取得
   * @param date 日付
   * @returns 曜日文字（日/月/火/水/木/金/土）
   */
  static getDayOfWeek(date: Date): string {
    return this.DAY_OF_WEEK[date.getDay()];
  }

  /**
   * 週末かどうかを判定
   * @param date 日付
   * @returns 週末ならtrue
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 日曜=0, 土曜=6
  }

  /**
   * 土曜日かどうかを判定
   * @param date 日付
   * @returns 土曜日ならtrue
   */
  static isSaturday(date: Date): boolean {
    return date.getDay() === 6;
  }

  /**
   * 日曜日かどうかを判定
   * @param date 日付
   * @returns 日曜日ならtrue
   */
  static isSunday(date: Date): boolean {
    return date.getDay() === 0;
  }

  /**
   * 本日かどうかを判定
   * @param date 日付
   * @param timezone タイムゾーン（オプション）
   * @returns 本日ならtrue
   */
  static isToday(date: Date, _timezone?: string): boolean {
    const today = this.stripTime(new Date());
    const target = this.stripTime(date);
    return today.getTime() === target.getTime();
  }

  /**
   * 日付をフォーマット
   * @param date 日付
   * @param format フォーマット文字列
   * @returns フォーマット済み文字列
   */
  static format(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = this.getDayOfWeek(date);

    let result = format;
    result = result.replace('YYYY', String(year));
    result = result.replace('MM', String(month).padStart(2, '0'));
    result = result.replace('DD', String(day).padStart(2, '0'));
    result = result.replace('M', String(month));
    result = result.replace('D', String(day));
    result = result.replace('ddd', dayOfWeek);

    return result;
  }

  /**
   * 期間が重なるかを判定
   * @param range1Start 期間1開始
   * @param range1End 期間1終了
   * @param range2Start 期間2開始
   * @param range2End 期間2終了
   * @returns 重なりがあればtrue
   */
  static isOverlapping(
    range1Start: Date,
    range1End: Date,
    range2Start: Date,
    range2End: Date
  ): boolean {
    const r1Start = this.stripTime(range1Start);
    const r1End = this.stripTime(range1End);
    const r2Start = this.stripTime(range2Start);
    const r2End = this.stripTime(range2End);

    return r1Start <= r2End && r1End >= r2Start;
  }

  /**
   * 日付の時刻部分を削除（0:00:00に設定）
   * @param date 日付
   * @returns 時刻部分を削除した日付
   */
  static stripTime(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * 日付が有効かどうかを判定
   * @param date 日付
   * @returns 有効ならtrue
   */
  static isValidDate(date: unknown): date is Date {
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * 文字列を日付に変換
   * @param dateString 日付文字列
   * @returns 日付オブジェクト
   * @throws 無効な日付形式の場合
   */
  static parseDate(dateString: string): Date {
    const date = new Date(dateString);
    if (!this.isValidDate(date)) {
      throw new Error(`Invalid date string: ${dateString}`);
    }
    return date;
  }
}
