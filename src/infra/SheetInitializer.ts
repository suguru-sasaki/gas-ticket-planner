/**
 * シート初期化サービス
 * 必要なシートが存在しない場合に自動作成する
 */

import { SHEET_NAMES } from './SheetNames';
import { DEFAULT_SETTINGS, SETTING_KEYS } from '../domain/models/Settings';
import { ISpreadsheetWrapper } from './SpreadsheetWrapper';

/**
 * シート初期化クラス
 */
export class SheetInitializer {
  constructor(private spreadsheet: ISpreadsheetWrapper) {}

  /**
   * 全シートを初期化
   * 存在しないシートのみ作成する
   * シート順序: 使い方 | テンプレート | 可視化設定
   */
  initializeAllSheets(): void {
    this.initializeUsageSheet();
    this.initializeTemplateSheet();
    this.initializeSettingsSheet();
  }

  /**
   * 初期化が必要かどうかを判定
   */
  needsInitialization(): boolean {
    const ss = this.spreadsheet.getActiveSpreadsheet();
    // テンプレートシートが存在しない場合は初期化が必要
    return ss.getSheetByName(SHEET_NAMES.TEMPLATES) === null;
  }

  /**
   * 使い方シートを初期化
   */
  private initializeUsageSheet(): void {
    const ss = this.spreadsheet.getActiveSpreadsheet();
    if (ss.getSheetByName(SHEET_NAMES.USAGE)) return;

    const sheet = ss.insertSheet(SHEET_NAMES.USAGE);
    const content = [
      ['GAS Ticket Planner - 使い方'],
      [''],
      ['■ 概要'],
      ['このツールは、Backlog連携による親子チケットの作成とガントチャート可視化を行います。'],
      [''],
      ['■ シート説明'],
      ['・使い方: このシート（操作説明）'],
      ['・テンプレート: 子チケットのテンプレートを管理'],
      ['・可視化設定: ガントチャートの色設定'],
      [''],
      ['■ 初期設定'],
      ['1. メニュー「チケット管理」→「Backlog設定...」でBacklog接続を設定'],
      ['2. テンプレートに子チケットのパターンを設定'],
      [''],
      ['■ 操作方法'],
      ['1. メニュー「チケット管理」→「チケット作成...」でBacklogにチケットを作成'],
      ['2. メニュー「チケット管理」→「ガント生成...」でガントチャートを生成'],
      [''],
      ['■ 注意事項'],
      ['・Backlog設定が必要です（APIキー、プロジェクトIDなど）'],
      ['・ガントシートは生成のたびに新規作成されます（右側に追加）'],
    ];

    sheet.getRange(1, 1, content.length, 1).setValues(content);
    sheet.setColumnWidth(1, 600);
    sheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
    sheet.setFrozenRows(1);
  }

  /**
   * テンプレートシートを初期化
   */
  private initializeTemplateSheet(): void {
    const ss = this.spreadsheet.getActiveSpreadsheet();
    if (ss.getSheetByName(SHEET_NAMES.TEMPLATES)) return;

    const sheet = ss.insertSheet(SHEET_NAMES.TEMPLATES);
    const headers = [['テンプレート名', '説明文', '開始日オフセット', '期間（日数）']];

    // サンプルデータ
    const sampleData = [
      ['要件定義', '// 顧客要望の整理\n要件をまとめる', 0, 3],
      ['設計', '// 技術仕様の決定\n基本設計・詳細設計', 3, 5],
      ['実装', 'コーディング作業', 8, 7],
      ['テスト', '// レビュー必須\n単体・結合テスト', 15, 3],
      ['リリース', '本番デプロイ', 18, 1],
    ];

    sheet.getRange(1, 1, 1, 4).setValues(headers);
    sheet.getRange(2, 1, sampleData.length, 4).setValues(sampleData);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#E3F2FD');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 120);
    sheet.setColumnWidth(2, 300);
    sheet.setColumnWidth(3, 120);
    sheet.setColumnWidth(4, 100);
  }

  /**
   * 可視化設定シートを初期化
   */
  private initializeSettingsSheet(): void {
    const ss = this.spreadsheet.getActiveSpreadsheet();
    if (ss.getSheetByName(SHEET_NAMES.SETTINGS)) return;

    const sheet = ss.insertSheet(SHEET_NAMES.SETTINGS);
    const headers = [['設定名', '設定値']];

    // デフォルト設定を書き込み
    const settingsData = [
      [SETTING_KEYS.parentColor, DEFAULT_SETTINGS.parentColor],
      [SETTING_KEYS.childColorNotStarted, DEFAULT_SETTINGS.childColorNotStarted],
      [SETTING_KEYS.childColorInProgress, DEFAULT_SETTINGS.childColorInProgress],
      [SETTING_KEYS.childColorCompleted, DEFAULT_SETTINGS.childColorCompleted],
      [SETTING_KEYS.saturdayColor, DEFAULT_SETTINGS.saturdayColor],
      [SETTING_KEYS.sundayColor, DEFAULT_SETTINGS.sundayColor],
      [SETTING_KEYS.holidayColor, DEFAULT_SETTINGS.holidayColor],
      [SETTING_KEYS.headerBackgroundColor, DEFAULT_SETTINGS.headerBackgroundColor],
    ];

    sheet.getRange(1, 1, 1, 2).setValues(headers);
    sheet.getRange(2, 1, settingsData.length, 2).setValues(settingsData);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#E3F2FD');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 120);
  }
}
