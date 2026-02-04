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
  setColumnWidth(column: number, width: number): void;
}

/**
 * レンジインターフェース
 * メソッドチェーン対応（setXXX系はIRangeを返す）
 */
export interface IRange {
  getValue(): unknown;
  getValues(): unknown[][];
  setValue(value: unknown): IRange;
  setValues(values: unknown[][]): IRange;
  setBackground(color: string): IRange;
  setBackgrounds(colors: string[][]): IRange;
  setNumberFormat(format: string): IRange;
  setFontWeight(weight: string): IRange;
  setFontSize(size: number): IRange;
  setHorizontalAlignment(alignment: string): IRange;
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
        this.spreadsheet.toast(message, title ?? '', timeout ?? 5);
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
      setColumnWidth: (column: number, width: number) => sheet.setColumnWidth(column, width),
    };
  }

  private wrapRange(range: GoogleAppsScript.Spreadsheet.Range): IRange {
    const wrapped: IRange = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      getValue: () => range.getValue(),
      getValues: () => range.getValues(),
      setValue: (value: unknown) => {
        range.setValue(value);
        return wrapped;
      },
      setValues: (values: unknown[][]) => {
        range.setValues(values);
        return wrapped;
      },
      setBackground: (color: string) => {
        range.setBackground(color);
        return wrapped;
      },
      setBackgrounds: (colors: string[][]) => {
        range.setBackgrounds(colors);
        return wrapped;
      },
      setNumberFormat: (format: string) => {
        range.setNumberFormat(format);
        return wrapped;
      },
      setFontWeight: (weight: string) => {
        range.setFontWeight(weight as 'bold' | 'normal' | null);
        return wrapped;
      },
      setFontSize: (size: number) => {
        range.setFontSize(size);
        return wrapped;
      },
      setHorizontalAlignment: (alignment: string) => {
        range.setHorizontalAlignment(alignment as 'left' | 'center' | 'right');
        return wrapped;
      },
    };
    return wrapped;
  }
}
