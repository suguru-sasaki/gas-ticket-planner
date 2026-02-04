/**
 * ガントチャート表示設定
 */
export interface GanttSettings {
  /** 親チケット色 */
  parentColor: string;
  /** 子チケット色（未着手） */
  childColorNotStarted: string;
  /** 子チケット色（進行中） */
  childColorInProgress: string;
  /** 子チケット色（完了） */
  childColorCompleted: string;
  /** 土曜日色（青系） */
  saturdayColor: string;
  /** 日曜日色（赤系） */
  sundayColor: string;
  /** 祝日色（赤系） */
  holidayColor: string;
  /** ヘッダ背景色 */
  headerBackgroundColor: string;
}

/**
 * デフォルト設定
 */
export const DEFAULT_SETTINGS: GanttSettings = {
  parentColor: '#4285F4',
  childColorNotStarted: '#E0E0E0',
  childColorInProgress: '#FFC107',
  childColorCompleted: '#4CAF50',
  saturdayColor: '#BBDEFB',
  sundayColor: '#FFCDD2',
  holidayColor: '#FFCDD2',
  headerBackgroundColor: '#E3F2FD',
};

/**
 * 設定項目名と設定キーのマッピング
 */
export const SETTING_KEY_MAP: Record<keyof GanttSettings, string> = {
  parentColor: '親チケット色',
  childColorNotStarted: '子チケット色_未着手',
  childColorInProgress: '子チケット色_進行中',
  childColorCompleted: '子チケット色_完了',
  saturdayColor: '土曜日色',
  sundayColor: '日曜日色',
  holidayColor: '祝日色',
  headerBackgroundColor: 'ヘッダ背景色',
};

/**
 * 設定ラベルから設定キーへの逆引きマッピング
 */
export const SETTING_LABEL_TO_KEY: Record<string, keyof GanttSettings> = {
  親チケット色: 'parentColor',
  子チケット色_未着手: 'childColorNotStarted',
  子チケット色_進行中: 'childColorInProgress',
  子チケット色_完了: 'childColorCompleted',
  土曜日色: 'saturdayColor',
  日曜日色: 'sundayColor',
  祝日色: 'holidayColor',
  ヘッダ背景色: 'headerBackgroundColor',
};

/**
 * 設定項目の日本語キー（スプレッドシート上の表示名）
 */
export const SETTING_KEYS = {
  parentColor: '親チケット色',
  childColorNotStarted: '子チケット色_未着手',
  childColorInProgress: '子チケット色_進行中',
  childColorCompleted: '子チケット色_完了',
  saturdayColor: '土曜日色',
  sundayColor: '日曜日色',
  holidayColor: '祝日色',
  headerBackgroundColor: 'ヘッダ背景色',
} as const;
