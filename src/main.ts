/**
 * GAS Ticket Planner - エントリポイント
 *
 * Google Apps Script のエントリポイント。
 * グローバル関数として公開される関数を定義する。
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
// 注: GAS のグローバル関数は外部から呼び出されるため、未使用警告を無効化

import { SpreadsheetWrapperImpl } from './infra/SpreadsheetWrapper';
import { SheetInitializer } from './infra/SheetInitializer';
import { TemplateRepository } from './infra/repositories/TemplateRepository';
import { SettingsRepository } from './infra/repositories/SettingsRepository';
import { GanttService, IGanttTicketRepository } from './domain/services/GanttService';
import { DateUtils } from './domain/utils/DateUtils';
import { AppError } from './errors/AppError';
import {
  BacklogRepository,
  BacklogConfig,
  getBacklogConfigFromProperties,
  saveBacklogConfigToProperties,
  clearBacklogConfig,
  BacklogClient,
} from './infra/backlog';

// ============================================================
// サービスのファクトリ関数
// ============================================================

function getSpreadsheetWrapper(): SpreadsheetWrapperImpl {
  return new SpreadsheetWrapperImpl();
}

function getTemplateRepository(): TemplateRepository {
  return new TemplateRepository(getSpreadsheetWrapper());
}

function getSettingsRepository(): SettingsRepository {
  return new SettingsRepository(getSpreadsheetWrapper());
}

// ============================================================
// グローバル関数（GASから直接呼び出される）
// ============================================================

/**
 * スプレッドシートを開いた時に実行される
 * カスタムメニューを作成し、必要に応じて初期化を行う
 */
function onOpen(): void {
  const ui = SpreadsheetApp.getUi();

  // メニュー作成
  ui.createMenu('チケット管理')
    .addItem('チケット作成（Backlog）...', 'showCreateTicketDialog')
    .addSeparator()
    .addItem('ガント生成...', 'showGanttDialog')
    .addSeparator()
    .addItem('Backlog設定...', 'showBacklogSettingsDialog')
    .addItem('シートを初期化', 'initializeSheets')
    .addItem('設定を初期化', 'resetSettings')
    .addItem('ヘルプ', 'showHelp')
    .addToUi();

  // 初回起動時の自動初期化
  const spreadsheet = getSpreadsheetWrapper();
  const initializer = new SheetInitializer(spreadsheet);
  if (initializer.needsInitialization()) {
    initializer.initializeAllSheets();
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'シートを初期化しました。担当者リストに担当者を追加してください。',
      '初期化完了',
      5
    );
  }
}

/**
 * シートを手動で初期化
 */
function initializeSheets(): void {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '確認',
    '不足しているシートを作成します。既存のシートは変更されません。続行しますか？',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const spreadsheet = getSpreadsheetWrapper();
    const initializer = new SheetInitializer(spreadsheet);
    initializer.initializeAllSheets();
    SpreadsheetApp.getActiveSpreadsheet().toast('シートを初期化しました', '完了', 3);
  }
}

/**
 * チケット作成ダイアログを表示
 */
function showCreateTicketDialog(): void {
  const html = HtmlService.createHtmlOutputFromFile('create-ticket')
    .setWidth(500)
    .setHeight(550);
  SpreadsheetApp.getUi().showModalDialog(html, 'チケット作成');
}

/**
 * ガント生成ダイアログを表示
 */
function showGanttDialog(): void {
  const html = HtmlService.createHtmlOutputFromFile('gantt-dialog')
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'ガント生成');
}

/**
 * 設定を初期化
 */
function resetSettings(): void {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '確認',
    '可視化設定をデフォルトに戻しますか？',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const settingsRepo = getSettingsRepository();
    settingsRepo.resetToDefault();
    SpreadsheetApp.getActiveSpreadsheet().toast('設定を初期化しました', '完了', 3);
  }
}

/**
 * ヘルプを表示（使い方シートをアクティブ化）
 */
function showHelp(): void {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('使い方');
  if (sheet) {
    sheet.activate();
  } else {
    SpreadsheetApp.getUi().alert('使い方シートが見つかりません');
  }
}

/**
 * Backlog設定ダイアログを表示
 */
function showBacklogSettingsDialog(): void {
  const html = HtmlService.createHtmlOutputFromFile('backlog-settings')
    .setWidth(500)
    .setHeight(550);
  SpreadsheetApp.getUi().showModalDialog(html, 'Backlog設定');
}

// ============================================================
// HTMLから呼び出される関数
// ============================================================

/**
 * 担当者リストを取得（Backlogから）
 * @returns 担当者の配列
 */
function getAssigneeList(): { name: string; email: string }[] {
  const backlogConfig = getBacklogConfigFromProperties();
  if (!backlogConfig) {
    throw new AppError('E110', 'Backlog設定が必要です。「チケット管理」→「Backlog設定」から設定してください');
  }

  const backlogRepo = new BacklogRepository(backlogConfig);
  return backlogRepo.getAssignees();
}

// ============================================================
// Backlog関連関数
// ============================================================

/**
 * Backlog設定を取得
 */
function getBacklogSettings(): BacklogConfig | null {
  return getBacklogConfigFromProperties();
}

/**
 * Backlog設定を保存
 */
function saveBacklogSettings(config: BacklogConfig): { success: boolean; error?: string } {
  try {
    saveBacklogConfigToProperties(config);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : '設定の保存に失敗しました';
    return { success: false, error: message };
  }
}

/**
 * Backlog設定をクリア
 */
function clearBacklogSettings(): void {
  clearBacklogConfig();
}

/**
 * Backlog接続テスト
 */
function testBacklogConnection(config: BacklogConfig): { success: boolean; projectName?: string; error?: string } {
  try {
    const client = new BacklogClient(config);
    const project = client.getProject();
    return { success: true, projectName: project.name };
  } catch (error) {
    const message = error instanceof AppError ? error.message :
      error instanceof Error ? error.message : '接続に失敗しました';
    return { success: false, error: message };
  }
}

/**
 * Backlog設定が有効かどうかを確認
 */
function isBacklogConfigured(): boolean {
  const config = getBacklogConfigFromProperties();
  return config !== null;
}

/**
 * チケットを作成（Backlogに作成）
 * @param formData フォームデータ
 * @returns 作成結果
 */
function createTicket(formData: {
  parentName: string;
  parentDescription: string;
  assignee: string;
  startDate: string;
  endDate: string;
}): { success: boolean; ticketCount?: number; issueKey?: string; error?: string } {
  try {
    // Backlog設定を確認
    const backlogConfig = getBacklogConfigFromProperties();
    if (!backlogConfig) {
      return { success: false, error: 'Backlog設定が必要です。「チケット管理」→「Backlog設定」から設定してください' };
    }

    // 日付をパース
    const startDate = DateUtils.parseDate(formData.startDate);
    const endDate = DateUtils.parseDate(formData.endDate);

    // 日付の検証
    if (startDate > endDate) {
      return { success: false, error: '開始日は終了日以前である必要があります' };
    }

    return createTicketToBacklog(formData, startDate, endDate, backlogConfig);
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : '予期せぬエラーが発生しました';
    return { success: false, error: message };
  }
}

/**
 * Backlogにチケットを作成
 */
function createTicketToBacklog(
  formData: {
    parentName: string;
    parentDescription: string;
    assignee: string;
  },
  startDate: Date,
  endDate: Date,
  config: BacklogConfig
): { success: boolean; ticketCount?: number; issueKey?: string; error?: string } {
  const backlogRepo = new BacklogRepository(config);
  const templateRepo = getTemplateRepository();

  // テンプレートを取得
  const templates = templateRepo.findAll();

  // 子チケット情報を展開
  const children = templates.map((template) => {
    const childStart = DateUtils.addDays(startDate, template.startOffset);
    const childEnd = DateUtils.addDays(childStart, template.duration - 1);
    return {
      name: template.name,
      description: template.description,
      startDate: childStart,
      endDate: childEnd,
    };
  });

  // Backlogに作成
  const result = backlogRepo.createTicketsFromTemplate({
    parentName: formData.parentName,
    parentDescription: formData.parentDescription,
    assignee: formData.assignee,
    startDate,
    endDate,
    children,
  });

  const ticketCount = 1 + result.children.length;
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Backlogに${ticketCount}件の課題を作成しました: ${result.parent.issueKey}`,
    '作成完了',
    5
  );

  return { success: true, ticketCount, issueKey: result.parent.issueKey };
}

/**
 * ガントを生成（Backlogからデータ取得）
 * @param params 生成パラメータ
 * @returns 生成結果
 */
function generateGantt(params: {
  startDate: string;
  endDate: string;
}): { success: boolean; sheetName?: string; error?: string } {
  try {
    // Backlog設定を確認
    const backlogConfig = getBacklogConfigFromProperties();
    if (!backlogConfig) {
      return { success: false, error: 'Backlog設定が必要です。「チケット管理」→「Backlog設定」から設定してください' };
    }

    const settingsRepo = getSettingsRepository();

    // 日付をパース
    const startDate = DateUtils.parseDate(params.startDate);
    const endDate = DateUtils.parseDate(params.endDate);

    // 日付の検証
    if (startDate > endDate) {
      return { success: false, error: '開始日は終了日以前である必要があります' };
    }

    // Backlogからデータ取得
    const ganttData = generateGanttFromBacklog(startDate, endDate, backlogConfig);

    if (ganttData.rows.length === 0) {
      return { success: false, error: '対象となるチケットがありません' };
    }

    // シート名を生成（タイムスタンプ付き）
    const now = new Date();
    const timestamp = Utilities.formatDate(
      now,
      SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(),
      'yyyyMMdd_HHmmss'
    );
    const sheetName = `ガント_${timestamp}`;

    // 新規シートを作成
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.insertSheet(sheetName);

    // ヘッダを書き込み
    sheet.getRange(1, 1, 1, ganttData.headers.length).setValues([ganttData.headers]);

    // ヘッダのスタイル設定
    sheet
      .getRange(1, 1, 1, ganttData.headers.length)
      .setFontWeight('bold')
      .setHorizontalAlignment('center');

    // ヘッダ行の背景色を設定（土日祝日で色分け）
    if (ganttData.headerBackgrounds.length > 0) {
      sheet
        .getRange(1, 1, 1, ganttData.headerBackgrounds.length)
        .setBackgrounds([ganttData.headerBackgrounds]);
    }

    // データ行を書き込み
    if (ganttData.rows.length > 0) {
      const rowData = ganttData.rows.map(row => [
        row.parentName,
        row.childName,
        row.memo,
        row.assignee,
        row.status,
        row.startDate,
        row.endDate,
        ...row.dateCells,
      ]);
      sheet.getRange(2, 1, rowData.length, rowData[0].length).setValues(rowData);

      // 背景色を設定
      sheet
        .getRange(2, 1, ganttData.backgrounds.length, ganttData.backgrounds[0].length)
        .setBackgrounds(ganttData.backgrounds);
    }

    // 固定行・固定列を設定
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(2);

    // 列幅調整
    sheet.setColumnWidth(1, 150); // 親チケット名
    sheet.setColumnWidth(2, 120); // 子チケット名
    sheet.setColumnWidth(3, 150); // メモ
    sheet.setColumnWidth(4, 80); // 担当者
    sheet.setColumnWidth(5, 60); // 状態
    sheet.setColumnWidth(6, 90); // 開始日
    sheet.setColumnWidth(7, 90); // 終了日

    // 日付列の幅
    for (let i = 8; i <= ganttData.headers.length; i++) {
      sheet.setColumnWidth(i, 45);
    }

    // シートをアクティブ化
    sheet.activate();

    SpreadsheetApp.getActiveSpreadsheet().toast(
      `ガントチャートを生成しました: ${sheetName}`,
      '生成完了',
      3
    );

    return { success: true, sheetName };
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : '予期せぬエラーが発生しました';
    return { success: false, error: message };
  }
}

/**
 * Backlogからデータを取得してガントデータを生成
 */
function generateGanttFromBacklog(
  startDate: Date,
  endDate: Date,
  config: BacklogConfig
): ReturnType<GanttService['generateGantt']> {
  const backlogRepo = new BacklogRepository(config);
  const settingsRepo = getSettingsRepository();

  // Backlogからチケット取得（親と子の両方が含まれる）
  const tickets = backlogRepo.findParentTicketsInRange(startDate, endDate);

  // GanttServiceに渡すためにTicketRepositoryのインターフェースを満たすオブジェクトを作成
  const mockTicketRepo = {
    findAll: () => tickets,
    findByParentId: (parentId: string) =>
      tickets.filter((t) => t.parentId === parentId),
    saveAll: () => {},
    getNextId: () => 'T-000',
    // GanttServiceが必要とするメソッド
    findParentsInPeriod: (start: Date, end: Date) =>
      tickets.filter((t) => {
        if (t.type !== 'parent') return false;
        // 期間が重なるかチェック
        return t.startDate <= end && t.endDate >= start;
      }),
    findChildren: (parentId: string) =>
      tickets.filter((t) => t.parentId === parentId),
  };

  // GanttServiceを使ってガントデータを生成
  const ganttService = new GanttService(
    mockTicketRepo as IGanttTicketRepository,
    settingsRepo
  );

  return ganttService.generateGantt({ startDate, endDate });
}

// ============================================================
// GASグローバル関数のエクスポート
// TypeScriptの未使用警告を回避するためのエクスポート
// module: "None" のため、コンパイル後はグローバル関数として残る
// ============================================================
export {
  onOpen,
  initializeSheets,
  showCreateTicketDialog,
  showGanttDialog,
  showBacklogSettingsDialog,
  resetSettings,
  showHelp,
  getAssigneeList,
  createTicket,
  generateGantt,
  // Backlog関連
  getBacklogSettings,
  saveBacklogSettings,
  clearBacklogSettings,
  testBacklogConnection,
  isBacklogConfigured,
};
