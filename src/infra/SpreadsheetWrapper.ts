import { AppError } from '../errors/AppError';

/**
 * シートインターフェース
 */
export interface ISheet {
  getName(): string;
  getLastRow(): number;
  getLastColumn(): number;
  getRange(row: number, col: number, numRows?: number, numCols?: number): IRange;
  setFrozenRows(rows: number): void;
  setFrozenColumns(cols: number): void;
}

/**
 * レンジインターフェース
 */
export interface IRange {
  getValue(): unknown;
  getValues(): unknown[][];
  setValue(value: unknown): void;
  setValues(values: unknown[][]): void;
  setBackground(color: string): void;
  setBackgrounds(colors: string[][]): void;
  setNumberFormat(format: string): void;
  setFontWeight(weight: string): void;
  setHorizontalAlignment(alignment: string): void;
}

/**
 * スプレッドシートインターフェース
 */
export interface ISpreadsheet {
  getSheetByName(name: string): ISheet | null;
  insertSheet(name: string): ISheet;
  toast(message: string, title?: string, timeout?: number): void;
  getSpreadsheetTimeZone(): string;
}

/**
 * スプレッドシートラッパーインターフェース
 * テスト時にモック差し替え可能にするための抽象化層
 */
export interface ISpreadsheetWrapper {
  getActiveSpreadsheet(): ISpreadsheet;
  getSheetByName(name: string): ISheet;
  createSheet(name: string): ISheet;
  getTimezone(): string;
}

/**
 * SpreadsheetAppの本番実装
 */
export class SpreadsheetWrapperImpl implements ISpreadsheetWrapper {
  private spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

  constructor() {
    this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  getActiveSpreadsheet(): ISpreadsheet {
    return {
      getSheetByName: (name: string) => {
        const sheet = this.spreadsheet.getSheetByName(name);
        return sheet ? this.wrapSheet(sheet) : null;
      },
      insertSheet: (name: string) => {
        const sheet = this.spreadsheet.insertSheet(name);
        return this.wrapSheet(sheet);
      },
      toast: (message: string, title?: string, timeout?: number) => {
        this.spreadsheet.toast(message, title, timeout);
      },
      getSpreadsheetTimeZone: () => {
        return this.spreadsheet.getSpreadsheetTimeZone();
      },
    };
  }

  getSheetByName(name: string): ISheet {
    const sheet = this.spreadsheet.getSheetByName(name);
    if (!sheet) {
      throw new AppError('E005', `シート "${name}" が見つかりません`);
    }
    return this.wrapSheet(sheet);
  }

  createSheet(name: string): ISheet {
    const sheet = this.spreadsheet.insertSheet(name);
    return this.wrapSheet(sheet);
  }

  getTimezone(): string {
    return this.spreadsheet.getSpreadsheetTimeZone();
  }

  private wrapSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet): ISheet {
    return {
      getName: () => sheet.getName(),
      getLastRow: () => sheet.getLastRow(),
      getLastColumn: () => sheet.getLastColumn(),
      getRange: (row: number, col: number, numRows = 1, numCols = 1) => {
        const range = sheet.getRange(row, col, numRows, numCols);
        return this.wrapRange(range);
      },
      setFrozenRows: (rows: number) => sheet.setFrozenRows(rows),
      setFrozenColumns: (cols: number) => sheet.setFrozenColumns(cols),
    };
  }

  private wrapRange(range: GoogleAppsScript.Spreadsheet.Range): IRange {
    return {
      getValue: () => range.getValue(),
      getValues: () => range.getValues(),
      setValue: (value: unknown) => range.setValue(value),
      setValues: (values: unknown[][]) => range.setValues(values),
      setBackground: (color: string) => range.setBackground(color),
      setBackgrounds: (colors: string[][]) => range.setBackgrounds(colors),
      setNumberFormat: (format: string) => range.setNumberFormat(format),
      setFontWeight: (weight: string) => range.setFontWeight(weight),
      setHorizontalAlignment: (alignment: string) =>
        range.setHorizontalAlignment(
          alignment as GoogleAppsScript.Spreadsheet.HorizontalAlignment
        ),
    };
  }
}
