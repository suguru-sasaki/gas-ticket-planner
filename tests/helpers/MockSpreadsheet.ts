import { AppError } from '../../src/errors/AppError';
import {
  ISheet,
  IRange,
  ISpreadsheet,
  ISpreadsheetWrapper,
} from '../../src/infra/SpreadsheetWrapper';

/**
 * テスト用モックRange
 */
export class MockRange implements IRange {
  constructor(
    private sheet: MockSheet,
    private startRow: number,
    private startCol: number,
    private numRows: number,
    private numCols: number
  ) {}

  getValue(): unknown {
    return this.sheet.getData(this.startRow, this.startCol);
  }

  getValues(): unknown[][] {
    const result: unknown[][] = [];
    for (let r = 0; r < this.numRows; r++) {
      const row: unknown[] = [];
      for (let c = 0; c < this.numCols; c++) {
        row.push(this.sheet.getData(this.startRow + r, this.startCol + c));
      }
      result.push(row);
    }
    return result;
  }

  setValue(value: unknown): void {
    this.sheet.setData(this.startRow, this.startCol, value);
  }

  setValues(values: unknown[][]): void {
    for (let r = 0; r < values.length; r++) {
      for (let c = 0; c < values[r].length; c++) {
        this.sheet.setData(this.startRow + r, this.startCol + c, values[r][c]);
      }
    }
  }

  setBackground(color: string): void {
    for (let r = 0; r < this.numRows; r++) {
      for (let c = 0; c < this.numCols; c++) {
        this.sheet.setBackground(this.startRow + r, this.startCol + c, color);
      }
    }
  }

  setBackgrounds(colors: string[][]): void {
    for (let r = 0; r < colors.length; r++) {
      for (let c = 0; c < colors[r].length; c++) {
        this.sheet.setBackground(this.startRow + r, this.startCol + c, colors[r][c]);
      }
    }
  }

  setNumberFormat(_format: string): void {
    // モック実装: 何もしない
  }

  setFontWeight(_weight: string): void {
    // モック実装: 何もしない
  }

  setHorizontalAlignment(_alignment: string): void {
    // モック実装: 何もしない
  }
}

/**
 * テスト用モックSheet
 */
export class MockSheet implements ISheet {
  private data: unknown[][] = [];
  private backgrounds: string[][] = [];
  private frozenRows = 0;
  private frozenCols = 0;

  constructor(
    private sheetName: string,
    initialData: unknown[][] = []
  ) {
    // ディープコピー
    this.data = JSON.parse(JSON.stringify(initialData)) as unknown[][];
  }

  getName(): string {
    return this.sheetName;
  }

  getLastRow(): number {
    return this.data.length;
  }

  getLastColumn(): number {
    return this.data.reduce((max, row) => Math.max(max, row.length), 0);
  }

  getRange(row: number, col: number, numRows = 1, numCols = 1): IRange {
    return new MockRange(this, row - 1, col - 1, numRows, numCols);
  }

  setFrozenRows(rows: number): void {
    this.frozenRows = rows;
  }

  setFrozenColumns(cols: number): void {
    this.frozenCols = cols;
  }

  // テスト用アクセサ
  getFrozenRows(): number {
    return this.frozenRows;
  }

  getFrozenColumns(): number {
    return this.frozenCols;
  }

  getData(row: number, col: number): unknown {
    if (!this.data[row]) return undefined;
    return this.data[row][col];
  }

  setData(row: number, col: number, value: unknown): void {
    while (this.data.length <= row) {
      this.data.push([]);
    }
    while (this.data[row].length <= col) {
      this.data[row].push(undefined);
    }
    this.data[row][col] = value;
  }

  setBackground(row: number, col: number, color: string): void {
    while (this.backgrounds.length <= row) {
      this.backgrounds.push([]);
    }
    while (this.backgrounds[row].length <= col) {
      this.backgrounds[row].push('');
    }
    this.backgrounds[row][col] = color;
  }

  getBackground(row: number, col: number): string {
    if (!this.backgrounds[row]) return '';
    return this.backgrounds[row][col] || '';
  }

  getAllData(): unknown[][] {
    return this.data;
  }

  getAllBackgrounds(): string[][] {
    return this.backgrounds;
  }
}

/**
 * テスト用モックSpreadsheetWrapper
 */
export class MockSpreadsheetWrapper implements ISpreadsheetWrapper {
  private sheets: Map<string, MockSheet> = new Map();
  private createdSheets: string[] = [];
  private timezone = 'Asia/Tokyo';
  private toastMessages: { message: string; title?: string }[] = [];

  /**
   * シートを追加
   */
  addSheet(name: string, data: unknown[][] = []): MockSheet {
    const sheet = new MockSheet(name, data);
    this.sheets.set(name, sheet);
    return sheet;
  }

  getActiveSpreadsheet(): ISpreadsheet {
    return {
      getSheetByName: (name: string) => this.sheets.get(name) || null,
      insertSheet: (name: string) => this.createSheet(name),
      toast: (message: string, title?: string) => {
        this.toastMessages.push({ message, title });
      },
      getSpreadsheetTimeZone: () => this.timezone,
    };
  }

  getSheetByName(name: string): ISheet {
    const sheet = this.sheets.get(name);
    if (!sheet) {
      throw new AppError('E005', `シート "${name}" が見つかりません`);
    }
    return sheet;
  }

  createSheet(name: string): ISheet {
    const sheet = new MockSheet(name);
    this.sheets.set(name, sheet);
    this.createdSheets.push(name);
    return sheet;
  }

  getTimezone(): string {
    return this.timezone;
  }

  // テスト用メソッド
  setTimezone(tz: string): void {
    this.timezone = tz;
  }

  getCreatedSheets(): string[] {
    return this.createdSheets;
  }

  getSheet(name: string): MockSheet | undefined {
    return this.sheets.get(name);
  }

  getSheetData(name: string): unknown[][] {
    const sheet = this.sheets.get(name);
    return sheet ? sheet.getAllData() : [];
  }

  getToastMessages(): { message: string; title?: string }[] {
    return this.toastMessages;
  }

  clearToastMessages(): void {
    this.toastMessages = [];
  }
}
