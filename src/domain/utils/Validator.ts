import { AppError, createAppError } from '../../errors/AppError';

/**
 * バリデーションユーティリティ
 */
export class Validator {
  private static readonly MAX_TICKET_NAME_LENGTH = 100;
  private static readonly MAX_DESCRIPTION_LENGTH = 1000;
  private static readonly HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * チケット名のバリデーション
   * @param name チケット名
   * @throws AppError 無効な場合
   */
  static validateTicketName(name: string): void {
    if (!name || name.trim() === '') {
      throw createAppError('E009');
    }
    if (name.length > this.MAX_TICKET_NAME_LENGTH) {
      throw new AppError(
        'E008',
        `チケット名は${this.MAX_TICKET_NAME_LENGTH}文字以内です`
      );
    }
  }

  /**
   * 説明文のバリデーション
   * @param description 説明文
   * @throws AppError 無効な場合
   */
  static validateDescription(description: string): void {
    if (description && description.length > this.MAX_DESCRIPTION_LENGTH) {
      throw new AppError(
        'E008',
        `説明文は${this.MAX_DESCRIPTION_LENGTH}文字以内です`
      );
    }
  }

  /**
   * 日付のバリデーション
   * @param date 日付（文字列またはDate）
   * @returns 有効なDateオブジェクト
   * @throws AppError 無効な場合
   */
  static validateDate(date: unknown): Date {
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        throw createAppError('E010');
      }
      return date;
    }

    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        throw createAppError('E010');
      }
      return parsed;
    }

    throw createAppError('E010');
  }

  /**
   * 日付範囲のバリデーション
   * @param startDate 開始日
   * @param endDate 終了日
   * @throws AppError 開始日が終了日より後の場合
   */
  static validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate > endDate) {
      throw createAppError('E003');
    }
  }

  /**
   * 色コードのバリデーション
   * @param color 色コード（HEX形式）
   * @throws AppError 無効な場合
   */
  static validateColorCode(color: string): void {
    if (!this.HEX_COLOR_REGEX.test(color)) {
      throw createAppError('E007', { color });
    }
  }

  /**
   * メールアドレスのバリデーション
   * @param email メールアドレス
   * @returns 有効かどうか
   */
  static isValidEmail(email: string): boolean {
    return this.EMAIL_REGEX.test(email);
  }

  /**
   * 整数のバリデーション
   * @param value 値
   * @param min 最小値
   * @param max 最大値（オプション）
   * @returns 有効な整数
   * @throws AppError 無効な場合
   */
  static validateInteger(
    value: unknown,
    min: number,
    max?: number
  ): number {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;

    if (typeof num !== 'number' || isNaN(num) || !Number.isInteger(num)) {
      throw new AppError('E008', '整数値が必要です');
    }

    if (num < min) {
      throw new AppError('E008', `値は${min}以上である必要があります`);
    }

    if (max !== undefined && num > max) {
      throw new AppError('E008', `値は${max}以下である必要があります`);
    }

    return num;
  }

  /**
   * 必須文字列のバリデーション
   * @param value 値
   * @param fieldName フィールド名（エラーメッセージ用）
   * @returns トリムされた文字列
   * @throws AppError 空の場合
   */
  static validateRequiredString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new AppError('E008', `${fieldName}は必須です`);
    }
    return value.trim();
  }
}
