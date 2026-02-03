/**
 * メモ抽出ユーティリティ
 * 説明文から // で始まる行を抽出する
 */
export class MemoExtractor {
  /**
   * 説明文からメモを抽出
   * // で始まる行の最初の1行を返す
   * @param description 説明文
   * @returns メモ文字列（なければ空文字）
   */
  static extract(description: string | null | undefined): string {
    if (!description) {
      return '';
    }

    const lines = description.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('//')) {
        // '//' を除去して返す
        return trimmed.substring(2).trim();
      }
    }

    return '';
  }
}
