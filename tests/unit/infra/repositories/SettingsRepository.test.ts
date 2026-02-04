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
        ['子チケット色_未着手', '#00FF00'],
        ['子チケット色_進行中', '#0000FF'],
        ['子チケット色_完了', '#FFFF00'],
      ]);
      repository = new SettingsRepository(mockSpreadsheet);

      const result = repository.getSettings();

      expect(result.parentColor).toBe('#FF0000');
      expect(result.childColorNotStarted).toBe('#00FF00');
      expect(result.childColorInProgress).toBe('#0000FF');
      expect(result.childColorCompleted).toBe('#FFFF00');
    });

    it('ヘッダのみの場合はデフォルト設定を返す', () => {
      createSettingsSheet();
      repository = new SettingsRepository(mockSpreadsheet);

      const result = repository.getSettings();

      // DEFAULT_SETTINGSの値を確認
      expect(result.parentColor).toBe('#4285F4');
      expect(result.childColorNotStarted).toBe('#E0E0E0');
      expect(result.childColorInProgress).toBe('#FFC107');
      expect(result.childColorCompleted).toBe('#4CAF50');
    });

    it('一部の設定のみの場合は残りはデフォルト値を使う', () => {
      createSettingsSheet([['親チケット色', '#FF0000']]);
      repository = new SettingsRepository(mockSpreadsheet);

      const result = repository.getSettings();

      expect(result.parentColor).toBe('#FF0000');
      expect(result.childColorNotStarted).toBe('#E0E0E0'); // デフォルト
    });
  });

  describe('resetToDefault', () => {
    it('設定をデフォルトに初期化できる', () => {
      createSettingsSheet([['親チケット色', '#FF0000']]);
      repository = new SettingsRepository(mockSpreadsheet);

      repository.resetToDefault();

      const result = repository.getSettings();
      expect(result.parentColor).toBe('#4285F4');
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
        ['親チケット色', '#4285F4'],
        ['子チケット色_未着手', '#E0E0E0'],
        ['子チケット色_進行中', '#FFC107'],
        ['子チケット色_完了', '#4CAF50'],
      ]);
      repository = new SettingsRepository(mockSpreadsheet);
    });

    it('親チケットの色を取得できる', () => {
      const result = repository.getTicketColor(true, '未着手');

      expect(result).toBe('#4285F4');
    });

    it('子チケット（未着手）の色を取得できる', () => {
      const result = repository.getTicketColor(false, '未着手');

      expect(result).toBe('#E0E0E0');
    });

    it('子チケット（進行中）の色を取得できる', () => {
      const result = repository.getTicketColor(false, '進行中');

      expect(result).toBe('#FFC107');
    });

    it('子チケット（完了）の色を取得できる', () => {
      const result = repository.getTicketColor(false, '完了');

      expect(result).toBe('#4CAF50');
    });

    it('不明な状態は未着手の色を返す', () => {
      const result = repository.getTicketColor(false, '不明');

      expect(result).toBe('#E0E0E0');
    });
  });
});
