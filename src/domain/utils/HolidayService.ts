/**
 * 祝日サービス
 * Google Calendar APIを使用して日本の祝日を取得
 */
export class HolidayService {
  /** 日本の祝日カレンダーID */
  private static readonly CALENDAR_ID = 'ja.japanese#holiday@group.v.calendar.google.com';

  /**
   * 指定期間内の祝日を取得
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 祝日の日付配列（時刻部分は0:00:00に正規化）
   */
  static getHolidays(startDate: Date, endDate: Date): Date[] {
    try {
      const calendar = CalendarApp.getCalendarById(this.CALENDAR_ID);
      if (!calendar) {
        console.warn('日本の祝日カレンダーが見つかりません');
        return [];
      }

      const events = calendar.getEvents(startDate, endDate);
      return events.map((event) => {
        const date = event.getStartTime();
        // 時刻部分を0:00:00に正規化
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      });
    } catch (error) {
      console.warn('祝日の取得に失敗しました:', error);
      return [];
    }
  }

  /**
   * 指定日が祝日かどうかを判定
   * @param date 判定対象日
   * @param holidays 祝日リスト
   * @returns 祝日ならtrue
   */
  static isHoliday(date: Date, holidays: Date[]): boolean {
    const targetTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ).getTime();

    return holidays.some((holiday) => holiday.getTime() === targetTime);
  }
}
