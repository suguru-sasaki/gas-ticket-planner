/**
 * 共通型定義
 */

/**
 * チケット状態
 */
export type TicketStatus = 'notStarted' | 'inProgress' | 'completed';

/**
 * チケット種別
 */
export type TicketType = 'parent' | 'child';

/**
 * 状態ラベルのマッピング
 */
export const STATUS_LABELS: Record<TicketStatus, string> = {
  notStarted: '未着手',
  inProgress: '進行中',
  completed: '完了',
};

/**
 * 状態の逆引きマッピング
 */
export const STATUS_FROM_LABEL: Record<string, TicketStatus> = {
  未着手: 'notStarted',
  進行中: 'inProgress',
  完了: 'completed',
};

/**
 * チケット種別ラベルのマッピング
 */
export const TYPE_LABELS: Record<TicketType, string> = {
  parent: '親',
  child: '子',
};

/**
 * チケット種別の逆引きマッピング
 */
export const TYPE_FROM_LABEL: Record<string, TicketType> = {
  親: 'parent',
  子: 'child',
};

/**
 * HTMLフォームからのチケット作成リクエスト
 */
export interface CreateTicketFormData {
  parentName: string;
  parentDescription: string;
  assignee: string;
  startDate: string; // ISO形式
  endDate: string; // ISO形式
}

/**
 * チケット作成の結果
 */
export interface CreateTicketResult {
  success: boolean;
  tickets?: import('../domain/models/Ticket').Ticket[];
  error?: string;
}

/**
 * ガント生成パラメータ
 */
export interface GanttParams {
  startDate: string; // ISO形式
  endDate: string; // ISO形式
}

/**
 * ガント生成の結果
 */
export interface GenerateGanttResult {
  success: boolean;
  sheetName?: string;
  error?: string;
}

/**
 * 日付範囲
 */
export interface DateRange {
  start: Date;
  end: Date;
}
