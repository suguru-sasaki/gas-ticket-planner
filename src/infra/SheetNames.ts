/**
 * シート名定数
 * シート名は固定とし、変更不可
 */
export const SHEET_NAMES = {
  /** 使い方説明シート */
  USAGE: '使い方',
  /** テンプレートシート */
  TEMPLATES: 'テンプレート',
  /** 可視化設定シート */
  SETTINGS: '可視化設定',
} as const;

/**
 * ガントシート名のプレフィックス
 */
export const GANTT_SHEET_PREFIX = 'ガント_';

/**
 * ガントシート名を生成
 * @param date 作成日時
 * @returns シート名 (ガント_YYYYMMDD_HHMMSS)
 */
export function generateGanttSheetName(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${GANTT_SHEET_PREFIX}${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * ガントシートの固定列数（親チケット名〜終了日）
 */
export const GANTT_FIXED_COLUMNS = 7;

/**
 * ガントシートのヘッダ
 */
export const GANTT_HEADERS = [
  '親チケット名',
  '子チケット名',
  'メモ',
  '担当者',
  '状態',
  '開始日',
  '終了日',
] as const;
