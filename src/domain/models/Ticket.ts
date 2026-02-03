import { TicketStatus, TicketType } from '../../types';

/**
 * チケットモデル
 */
export interface Ticket {
  /** チケットID (T-001形式) */
  id: string;
  /** 親チケットID (子の場合のみ) */
  parentId: string | null;
  /** チケット種別 */
  type: TicketType;
  /** チケット名 */
  name: string;
  /** 説明文 */
  description: string;
  /** 担当者名 */
  assignee: string;
  /** 状態 */
  status: TicketStatus;
  /** 開始日 */
  startDate: Date;
  /** 終了日 */
  endDate: Date;
  /** 作成日時 */
  createdAt: Date;
}

/**
 * チケット作成パラメータ
 */
export interface CreateTicketParams {
  parentName: string;
  parentDescription: string;
  assignee: string;
  startDate: Date;
  endDate: Date;
}

/**
 * 新規チケット（ID未採番）
 */
export type NewTicket = Omit<Ticket, 'id' | 'createdAt'>;
