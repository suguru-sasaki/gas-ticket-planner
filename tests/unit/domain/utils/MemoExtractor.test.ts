import { MemoExtractor } from '../../../../src/domain/utils/MemoExtractor';

describe('MemoExtractor', () => {
  describe('extract', () => {
    it('//で始まる行からメモを抽出する', () => {
      const description = '通常のテキスト\n// これはメモです\n続きのテキスト';
      expect(MemoExtractor.extract(description)).toBe('これはメモです');
    });

    it('複数の//行がある場合は最初の1行のみを返す', () => {
      const description = '// 最初のメモ\nテキスト\n// 二番目のメモ';
      expect(MemoExtractor.extract(description)).toBe('最初のメモ');
    });

    it('//行がない場合は空文字を返す', () => {
      const description = '通常のテキストのみ\n改行あり';
      expect(MemoExtractor.extract(description)).toBe('');
    });

    it('空文字の場合は空文字を返す', () => {
      expect(MemoExtractor.extract('')).toBe('');
    });

    it('nullの場合は空文字を返す', () => {
      expect(MemoExtractor.extract(null)).toBe('');
    });

    it('undefinedの場合は空文字を返す', () => {
      expect(MemoExtractor.extract(undefined)).toBe('');
    });

    it('//の後にスペースがない場合も抽出する', () => {
      const description = '//メモです';
      expect(MemoExtractor.extract(description)).toBe('メモです');
    });

    it('行頭のスペース後に//がある場合も抽出する', () => {
      const description = '  // インデントされたメモ';
      expect(MemoExtractor.extract(description)).toBe('インデントされたメモ');
    });

    it('//のみの行は空文字のメモとして扱う', () => {
      const description = '//\nテキスト';
      expect(MemoExtractor.extract(description)).toBe('');
    });

    it('途中に//を含む行（URLなど）は抽出しない', () => {
      const description = 'URL: https://example.com\nテキスト';
      expect(MemoExtractor.extract(description)).toBe('');
    });

    it('先頭が//でない場合は抽出しない', () => {
      const description = 'コメント // これはコメント';
      expect(MemoExtractor.extract(description)).toBe('');
    });

    it('日本語のメモを正しく抽出する', () => {
      const description = '説明文\n// 要確認：仕様変更あり';
      expect(MemoExtractor.extract(description)).toBe('要確認：仕様変更あり');
    });

    it('特殊文字を含むメモを正しく抽出する', () => {
      const description = '// @TODO: Fix bug #123';
      expect(MemoExtractor.extract(description)).toBe('@TODO: Fix bug #123');
    });

    it('タブでインデントされた//行も抽出する', () => {
      const description = '\t// タブインデントのメモ';
      expect(MemoExtractor.extract(description)).toBe('タブインデントのメモ');
    });

    it('Windows形式の改行（CRLF）でも正しく処理する', () => {
      const description = 'テキスト\r\n// メモ\r\n続き';
      expect(MemoExtractor.extract(description)).toBe('メモ');
    });
  });
});
