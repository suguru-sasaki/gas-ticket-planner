import { Ticket } from '../../domain/models/Ticket';
import { IdGenerator } from '../../domain/utils/IdGenerator';
import {
  STATUS_FROM_LABEL,
  STATUS_LABELS,
  TYPE_FROM_LABEL,
  TYPE_LABELS,
  TicketStatus,
  TicketType,
} from '../../types';
import { SHEET_NAMES, TICKET_COLUMNS } from '../SheetNames';
import { ISpreadsheetWrapper } from '../SpreadsheetWrapper';

/**
 * チケットリポジトリ
 * チケット管理シートのデータを管理する
 */
export class TicketRepository {
  constructor(private spreadsheet: ISpreadsheetWrapper) {}

  /**
   * 全チケットを取得
   * @returns チケットの配列
   */
  findAll(): Ticket[] {
    const sheet = this.spreadsheet.getSheetByName(SHEET_NAMES.TICKETS);
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return []; // ヘッダのみ
    }

    const values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();

    return values
      .filter(row => row[TICKET_COLUMNS.ID] && String(row[TICKET_COLUMNS.ID]).trim() !== '')
      .map(row => this.rowToTicket(row));
  }

  /**
   * 親チケットのみを取得
   * @returns 親チケットの配列
   */
  findParents(): Ticket[] {
    return this.findAll().filter(t => t.type === 'parent');
  }

  /**
   * 子チケットのみを取得
   * @param parentId 親チケットID（指定した場合はその親の子のみ）
   * @returns 子チケットの配列
   */
  findChildren(parentId?: string): Ticket[] {
    const children = this.findAll().filter(t => t.type === 'child');
    if (parentId) {
      return children.filter(t => t.parentId === parentId);
    }
    return children;
  }

  /**
   * IDでチケットを取得
   * @param id チケットID
   * @returns チケット（見つからない場合はnull）
   */
  findById(id: string): Ticket | null {
    const tickets = this.findAll();
    return tickets.find(t => t.id === id) || null;
  }

  /**
   * 指定期間に重なる親チケットを取得
   * @param startDate 期間開始日
   * @param endDate 期間終了日
   * @returns 該当する親チケットの配列
   */
  findParentsInPeriod(startDate: Date, endDate: Date): Ticket[] {
    return this.findParents().filter(t => this.isOverlapping(t, startDate, endDate));
  }

  /**
   * チケットを一括保存
   * @param tickets 保存するチケットの配列
   */
  saveAll(tickets: Ticket[]): void {
    if (tickets.length === 0) return;

    const sheet = this.spreadsheet.getSheetByName(SHEET_NAMES.TICKETS);
    const lastRow = sheet.getLastRow();

    const values = tickets.map(t => this.ticketToRow(t));
    sheet.getRange(lastRow + 1, 1, values.length, 10).setValues(values);
  }

  /**
   * 次のチケットIDを取得
   * @returns 次のチケットID
   */
  getNextId(): string {
    const tickets = this.findAll();
    const existingIds = tickets.map(t => t.id);
    return IdGenerator.generateTicketId(existingIds);
  }

  /**
   * 複数の連続したIDを生成
   * @param count 生成するID数
   * @returns ID配列
   */
  generateIds(count: number): string[] {
    const tickets = this.findAll();
    const existingIds = tickets.map(t => t.id);
    const ids: string[] = [];

    for (let i = 0; i < count; i++) {
      const newId = IdGenerator.generateTicketId([...existingIds, ...ids]);
      ids.push(newId);
    }

    return ids;
  }

  /**
   * 行データをチケットオブジェクトに変換
   */
  private rowToTicket(row: unknown[]): Ticket {
    const typeLabel = String(row[TICKET_COLUMNS.TYPE]);
    const statusLabel = String(row[TICKET_COLUMNS.STATUS]);

    return {
      id: String(row[TICKET_COLUMNS.ID]),
      parentId: row[TICKET_COLUMNS.PARENT_ID]
        ? String(row[TICKET_COLUMNS.PARENT_ID])
        : null,
      type: this.parseType(typeLabel),
      name: String(row[TICKET_COLUMNS.NAME]),
      description: String(row[TICKET_COLUMNS.DESCRIPTION] || ''),
      assignee: String(row[TICKET_COLUMNS.ASSIGNEE]),
      status: this.parseStatus(statusLabel),
      startDate: this.parseDate(row[TICKET_COLUMNS.START_DATE]),
      endDate: this.parseDate(row[TICKET_COLUMNS.END_DATE]),
      createdAt: this.parseDate(row[TICKET_COLUMNS.CREATED_AT]),
    };
  }

  /**
   * チケットオブジェクトを行データに変換
   */
  private ticketToRow(ticket: Ticket): unknown[] {
    return [
      ticket.id,
      ticket.parentId || '',
      TYPE_LABELS[ticket.type],
      ticket.name,
      ticket.description,
      ticket.assignee,
      STATUS_LABELS[ticket.status],
      ticket.startDate,
      ticket.endDate,
      ticket.createdAt,
    ];
  }

  /**
   * 状態ラベルをパース
   */
  private parseStatus(label: string): TicketStatus {
    return STATUS_FROM_LABEL[label] || 'notStarted';
  }

  /**
   * チケット種別をパース
   */
  private parseType(label: string): TicketType {
    return TYPE_FROM_LABEL[label] || 'parent';
  }

  /**
   * 日付をパース
   */
  private parseDate(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return new Date();
  }

  /**
   * チケットが指定期間と重なるかを判定
   */
  private isOverlapping(ticket: Ticket, startDate: Date, endDate: Date): boolean {
    return ticket.startDate <= endDate && ticket.endDate >= startDate;
  }
}
