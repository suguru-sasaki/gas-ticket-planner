/**
 * ID採番ユーティリティ
 */
export class IdGenerator {
  private static readonly PREFIX = 'T-';
  private static readonly MIN_DIGITS = 3;

  /**
   * 新しいチケットIDを生成
   * @param existingIds 既存のチケットID配列
   * @returns 新しいチケットID (T-XXX)
   */
  static generateTicketId(existingIds: string[]): string {
    if (existingIds.length === 0) {
      return `${this.PREFIX}001`;
    }

    const maxNumber = existingIds
      .map(id => this.extractNumber(id))
      .filter(num => !isNaN(num))
      .reduce((max, num) => Math.max(max, num), 0);

    const newNumber = maxNumber + 1;
    return this.formatId(newNumber);
  }

  /**
   * IDから数値部分を抽出
   * @param id チケットID
   * @returns 数値部分
   */
  static extractNumber(id: string): number {
    if (!id || !id.startsWith(this.PREFIX)) {
      return NaN;
    }

    const numberPart = id.substring(this.PREFIX.length);
    return parseInt(numberPart, 10);
  }

  /**
   * 数値からIDをフォーマット
   * @param num 数値
   * @returns フォーマットされたID
   */
  private static formatId(num: number): string {
    const paddedNumber = String(num).padStart(this.MIN_DIGITS, '0');
    return `${this.PREFIX}${paddedNumber}`;
  }

  /**
   * IDが有効な形式かどうかを判定
   * @param id チケットID
   * @returns 有効ならtrue
   */
  static isValidId(id: string): boolean {
    if (!id || !id.startsWith(this.PREFIX)) {
      return false;
    }
    const num = this.extractNumber(id);
    return !isNaN(num) && num > 0;
  }
}
