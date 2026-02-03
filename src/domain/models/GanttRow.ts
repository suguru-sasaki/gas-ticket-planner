import { Ticket } from './Ticket';

/**
 * ガントチャートの1行を表すモデル
 */
export interface GanttRow {
  /** 親チケット名 */
  parentName: string;
  /** 子チケット名（親の場合は空文字） */
  childName: string;
  /** メモ（説明文から抽出） */
  memo: string;
  /** 担当者 */
  assignee: string;
  /** 状態（日本語） */
  status: string;
  /** 開始日 */
  startDate: Date;
  /** 終了日 */
  endDate: Date;
  /** 親チケットかどうか */
  isParent: boolean;
  /** 元チケット（色決定用） */
  ticket: Ticket;
}

/**
 * ガントヘッダ（日付列）
 */
export interface GanttHeader {
  /** 日付 */
  date: Date;
  /** 表示ラベル (M/D (曜)) */
  label: string;
  /** 週末フラグ */
  isWeekend: boolean;
  /** 本日フラグ */
  isToday: boolean;
}

/**
 * ガント生成データ
 */
export interface GanttData {
  /** ガント行データ */
  rows: GanttRow[];
  /** 表示日付範囲 */
  dateRange: {
    start: Date;
    end: Date;
  };
  /** ヘッダ情報 */
  headers: GanttHeader[];
}
