import { Template } from '../../domain/models/Template';
import { AppError } from '../../errors/AppError';
import { SHEET_NAMES } from '../SheetNames';
import { ISpreadsheetWrapper } from '../SpreadsheetWrapper';

/**
 * テンプレートリポジトリ
 * 子チケットテンプレートシートのデータを管理する
 */
export class TemplateRepository {
  constructor(private spreadsheet: ISpreadsheetWrapper) {}

  /**
   * 全テンプレートを取得
   * @returns テンプレートの配列
   */
  findAll(): Template[] {
    const sheet = this.spreadsheet.getSheetByName(SHEET_NAMES.TEMPLATES);
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return []; // ヘッダのみ
    }

    const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();

    return values
      .filter(row => row[0] && String(row[0]).trim() !== '')
      .map(row => this.rowToTemplate(row));
  }

  /**
   * 行データをテンプレートオブジェクトに変換
   */
  private rowToTemplate(row: unknown[]): Template {
    const name = String(row[0]).trim();
    const description = String(row[1] || '').trim();
    const startOffset = this.parseNumber(row[2], 0);
    const duration = this.parseNumber(row[3], 1);

    // バリデーション
    if (startOffset < 0) {
      throw new AppError(
        'E006',
        `テンプレート "${name}" の開始日オフセットが不正です: ${startOffset}`
      );
    }
    if (duration < 1) {
      throw new AppError(
        'E006',
        `テンプレート "${name}" の期間が不正です: ${duration}`
      );
    }

    return {
      name,
      description,
      startOffset,
      duration,
    };
  }

  /**
   * 数値をパース（デフォルト値付き）
   */
  private parseNumber(value: unknown, defaultValue: number): number {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    const num = Number(value);
    return isNaN(num) ? defaultValue : Math.floor(num);
  }
}
