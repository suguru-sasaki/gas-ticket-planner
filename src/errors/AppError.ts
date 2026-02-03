/**
 * アプリケーションエラークラス
 * ビジネスロジックで発生するエラーを表現する
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;

    // Error クラスを継承する際の対応
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): { code: string; message: string; details?: unknown } {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * エラーコード定義
 */
export const ERROR_CODES = {
  E001: '担当者リストが空です',
  E002: '指定された担当者が見つかりません',
  E003: '開始日は終了日以前である必要があります',
  E004: '対象となるチケットがありません',
  E005: 'シートの作成に失敗しました',
  E006: 'テンプレートの読み込みに失敗しました',
  E007: '設定値が不正です',
  E008: '入力値が不正です',
  E009: 'チケット名は必須です',
  E010: '無効な日付形式です',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * エラーコードからAppErrorを生成するヘルパー
 */
export function createAppError(code: ErrorCode, details?: unknown): AppError {
  return new AppError(code, ERROR_CODES[code], details);
}
