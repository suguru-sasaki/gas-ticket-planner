/**
 * 子チケットテンプレートモデル
 */
export interface Template {
  /** 子チケット名 */
  name: string;
  /** 説明文 */
  description: string;
  /** 開始日オフセット（親開始日からの相対日数） */
  startOffset: number;
  /** 期間（日数） */
  duration: number;
}
