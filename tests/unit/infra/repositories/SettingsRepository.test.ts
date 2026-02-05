import { SettingsRepository } from '../../../../src/infra/repositories/SettingsRepository';
import { MockSpreadsheetWrapper } from '../../../helpers/MockSpreadsheet';

describe('SettingsRepository', () => {
  let mockSpreadsheet: MockSpreadsheetWrapper;
  let repository: SettingsRepository;

  const createSettingsSheet = (data: unknown[][] = []) => {
    const header = ['設定名', '設定値'];
    mockSpreadsheet.addSheet('可視化設定', [header, ...data]);
  };

  beforeEach(() => {
    mockSpreadsheet = new MockSpreadsheetWrapper();
  });

  describe('getSettings', () => {
    it('設定を取得できる', () => {
      createSettingsSheet([
        ['親チケット色', '#FF0000'],
        ['子チケット色_未対応', '#00FF00'],
        ['子チケット色_処理中', '#0000FF'],
        ['子チケット色_処理済み', '#00FFFF'],
        ['子チケット色_完了', '#FFFF00'],
        ['遅延色', '#FF00FF'],
      ]);
      repository = new SettingsRepository(mockSpreadsheet);

      const result = repository.getSettings();

      expect(result.parentColor).toBe('#FF0000');
      expect(result.childColorNotStarted).toBe('#00FF00');
      expect(result.childColorInProgress).toBe('#0000FF');
      expect(result.childColorProcessed).toBe('#00FFFF');
      expect(result.childColorCompleted).toBe('#FFFF00');
      expect(result.overdueColor).toBe('#FF00FF');
    });

    it('ヘッダのみの場合はデフォルト設定を返す', () => {
      createSettingsSheet();
      repository = new SettingsRepository(mockSpreadsheet);

      const result = repository.getSettings();

      // DEFAULT_SETTINGSの値を確認
      expect(result.parentColor).toBe('#ddefe5');
      expect(result.childColorNotStarted).toBe('#ee7f77');
      expect(result.childColorInProgress).toBe('#4389c5');
      expect(result.childColorProcessed).toBe('#5db5a5');
      expect(result.childColorCompleted).toBe('#a1af2f');
    });

    it('一部の設定のみの場合は残りはデフォルト値を使う', () => {
      createSettingsSheet([['親チケット色', '#FF0000']]);
      repository = new SettingsRepository(mockSpreadsheet);

      const result = repository.getSettings();

      expect(result.parentColor).toBe('#FF0000');
      expect(result.childColorNotStarted).toBe('#ee7f77'); // デフォルト
    });
  });

  describe('resetToDefault', () => {
    it('設定をデフォルトに初期化できる', () => {
      createSettingsSheet([['親チケット色', '#FF0000']]);
      repository = new SettingsRepository(mockSpreadsheet);

      repository.resetToDefault();

      const result = repository.getSettings();
      expect(result.parentColor).toBe('#ddefe5');
    });
  });

  describe('updateSetting', () => {
    it('個別の設定を更新できる', () => {
      createSettingsSheet([['親チケット色', '#4285F4']]);
      repository = new SettingsRepository(mockSpreadsheet);

      repository.updateSetting('parentColor', '#FF0000');

      const result = repository.getSettings();
      expect(result.parentColor).toBe('#FF0000');
    });

    it('存在しない設定は新規追加される', () => {
      createSettingsSheet();
      repository = new SettingsRepository(mockSpreadsheet);

      repository.updateSetting('parentColor', '#FF0000');

      const result = repository.getSettings();
      expect(result.parentColor).toBe('#FF0000');
    });
  });

  describe('getTicketColor', () => {
    beforeEach(() => {
      createSettingsSheet([
        ['親チケット色', '#ddefe5'],
        ['子チケット色_未対応', '#ee7f77'],
        ['子チケット色_処理中', '#4389c5'],
        ['子チケット色_処理済み', '#5db5a5'],
        ['子チケット色_完了', '#a1af2f'],
      ]);
      repository = new SettingsRepository(mockSpreadsheet);
    });

    it('親チケットの色を取得できる', () => {
      const result = repository.getTicketColor(true, '未対応');

      expect(result).toBe('#ddefe5');
    });

    it('子チケット（未対応）の色を取得できる', () => {
      const result = repository.getTicketColor(false, '未対応');

      expect(result).toBe('#ee7f77');
    });

    it('子チケット（処理中）の色を取得できる', () => {
      const result = repository.getTicketColor(false, '処理中');

      expect(result).toBe('#4389c5');
    });

    it('子チケット（処理済み）の色を取得できる', () => {
      const result = repository.getTicketColor(false, '処理済み');

      expect(result).toBe('#5db5a5');
    });

    it('子チケット（完了）の色を取得できる', () => {
      const result = repository.getTicketColor(false, '完了');

      expect(result).toBe('#a1af2f');
    });

    it('不明な状態は未対応の色を返す', () => {
      const result = repository.getTicketColor(false, '不明');

      expect(result).toBe('#ee7f77');
    });
  });
});
