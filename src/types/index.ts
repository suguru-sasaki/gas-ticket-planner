/**
 * 共通型定義
 */

/**
 * チケット状態
 */
export type TicketStatus = 'notStarted' | 'inProgress' | 'processed' | 'completed';

/**
 * チケット種別
 */
export type TicketType = 'parent' | 'child';

/**
 * 状態ラベルのマッピング
 */
export const STATUS_LABELS: Record<TicketStatus, string> = {
  notStarted: '未対応',
  inProgress: '処理中',
  processed: '処理済み',
  completed: '完了',
};

/**
 * 状態の逆引きマッピング
 */
export const STATUS_FROM_LABEL: Record<string, TicketStatus> = {
  未対応: 'notStarted',
  処理中: 'inProgress',
  処理済み: 'processed',
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
