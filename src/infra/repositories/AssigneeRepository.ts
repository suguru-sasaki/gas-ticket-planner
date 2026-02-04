import { Assignee } from '../../domain/models/Assignee';
import { AppError } from '../../errors/AppError';
import { SHEET_NAMES } from '../SheetNames';
import { ISpreadsheetWrapper } from '../SpreadsheetWrapper';

/**
 * 担当者リポジトリ
 * 担当者リストシートのデータを管理する
 */
export class AssigneeRepository {
  constructor(private spreadsheet: ISpreadsheetWrapper) {}

  /**
   * 全担当者を取得
   * @returns 担当者の配列
   */
  findAll(): Assignee[] {
    const sheet = this.spreadsheet.getSheetByName(SHEET_NAMES.ASSIGNEES);
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return []; // ヘッダのみ
    }

    const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();

    return values
      .filter(row => row[0] && String(row[0]).trim() !== '')
      .map(row => this.rowToAssignee(row));
  }

  /**
   * 名前で担当者を検索
   * @param name 担当者名
   * @returns 担当者（見つからない場合はnull）
   */
  findByName(name: string): Assignee | null {
    const assignees = this.findAll();
    return assignees.find(a => a.name === name) || null;
  }

  /**
   * 担当者が存在するか確認
   * @param name 担当者名
   * @returns 存在すればtrue
   */
  exists(name: string): boolean {
    return this.findByName(name) !== null;
  }

  /**
   * 担当者リストが空でないことを確認
   * @throws AppError 空の場合
   */
  ensureNotEmpty(): void {
    const assignees = this.findAll();
    if (assignees.length === 0) {
      throw new AppError('E001', '担当者リストが空です');
    }
  }

  /**
   * 行データを担当者オブジェクトに変換
   */
  private rowToAssignee(row: unknown[]): Assignee {
    return {
      name: String(row[0]).trim(),
      email: String(row[1] || '').trim(),
    };
  }
}
