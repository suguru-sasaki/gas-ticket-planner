import {
  DEFAULT_SETTINGS,
  GanttSettings,
  SETTING_KEY_MAP,
  SETTING_LABEL_TO_KEY,
} from '../../domain/models/Settings';
import { SHEET_NAMES } from '../SheetNames';
import { ISpreadsheetWrapper } from '../SpreadsheetWrapper';

/**
 * 設定リポジトリ
 * 可視化設定シートのデータを管理する
 */
export class SettingsRepository {
  constructor(private spreadsheet: ISpreadsheetWrapper) {}

  /**
   * 設定を取得
   * @returns ガント設定
   */
  getSettings(): GanttSettings {
    const sheet = this.spreadsheet.getSheetByName(SHEET_NAMES.SETTINGS);
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return { ...DEFAULT_SETTINGS }; // デフォルト設定を返す
    }

    const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    const settings: GanttSettings = { ...DEFAULT_SETTINGS };

    for (const [label, value] of values) {
      const key = SETTING_LABEL_TO_KEY[String(label)];
      if (key && value) {
        settings[key] = String(value);
      }
    }

    return settings;
  }

  /**
   * 設定をデフォルトに初期化
   */
  resetToDefault(): void {
    const sheet = this.spreadsheet.getSheetByName(SHEET_NAMES.SETTINGS);
    const lastRow = sheet.getLastRow();

    // 既存のデータをクリア（ヘッダは残す）
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 2).setValues(
        Array(lastRow - 1)
          .fill(null)
          .map(() => ['', ''])
      );
    }

    // デフォルト設定を書き込み
    const rows = Object.entries(SETTING_KEY_MAP).map(([key, label]) => [
      label,
      DEFAULT_SETTINGS[key as keyof GanttSettings],
    ]);

    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }

  /**
   * 個別の設定を更新
   * @param key 設定キー
   * @param value 設定値
   */
  updateSetting(key: keyof GanttSettings, value: string): void {
    const sheet = this.spreadsheet.getSheetByName(SHEET_NAMES.SETTINGS);
    const lastRow = sheet.getLastRow();
    const label = SETTING_KEY_MAP[key];

    // 既存の行を探す
    if (lastRow > 1) {
      const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < values.length; i++) {
        if (values[i][0] === label) {
          sheet.getRange(i + 2, 2).setValue(value);
          return;
        }
      }
    }

    // 見つからなければ新しい行を追加
    sheet.getRange(lastRow + 1, 1, 1, 2).setValues([[label, value]]);
  }

  /**
   * チケットの状態に応じた色を取得
   * @param isParent 親チケットかどうか
   * @param status チケットの状態
   * @returns 背景色
   */
  getTicketColor(isParent: boolean, status: string): string {
    const settings = this.getSettings();

    if (isParent) {
      return settings.parentColor;
    }

    switch (status) {
      case '未対応':
        return settings.childColorNotStarted;
      case '処理中':
        return settings.childColorInProgress;
      case '処理済み':
        return settings.childColorProcessed;
      case '完了':
        return settings.childColorCompleted;
      default:
        return settings.childColorNotStarted;
    }
  }
}
