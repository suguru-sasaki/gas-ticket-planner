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
import { AssigneeRepository } from './infra/repositories/AssigneeRepository';
import { TemplateRepository } from './infra/repositories/TemplateRepository';
import { TicketRepository } from './infra/repositories/TicketRepository';
import { SettingsRepository } from './infra/repositories/SettingsRepository';
import { TemplateService } from './domain/services/TemplateService';
import { TicketService } from './domain/services/TicketService';
import { GanttService } from './domain/services/GanttService';
import { DateUtils } from './domain/utils/DateUtils';
import { AppError } from './errors/AppError';

// ============================================================
// サービスのファクトリ関数
// ============================================================

function getSpreadsheetWrapper(): SpreadsheetWrapperImpl {
  return new SpreadsheetWrapperImpl();
}

function getAssigneeRepository(): AssigneeRepository {
  return new AssigneeRepository(getSpreadsheetWrapper());
}

function getTemplateRepository(): TemplateRepository {
  return new TemplateRepository(getSpreadsheetWrapper());
}

function getTicketRepository(): TicketRepository {
  return new TicketRepository(getSpreadsheetWrapper());
}

function getSettingsRepository(): SettingsRepository {
  return new SettingsRepository(getSpreadsheetWrapper());
}

function getTemplateService(): TemplateService {
  return new TemplateService(
    getTemplateRepository(),
    getTicketRepository(),
    getAssigneeRepository()
  );
}

function getTicketService(): TicketService {
  return new TicketService(getTicketRepository(), getAssigneeRepository());
}

function getGanttService(): GanttService {
  return new GanttService(getTicketRepository(), getSettingsRepository());
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
    .addItem('チケット作成...', 'showCreateTicketDialog')
    .addSeparator()
    .addItem('ガント生成...', 'showGanttDialog')
    .addSeparator()
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

// ============================================================
// HTMLから呼び出される関数
// ============================================================

/**
 * 担当者リストを取得
 * @returns 担当者の配列
 */
function getAssigneeList(): { name: string; email: string }[] {
  const assigneeRepo = getAssigneeRepository();
  return assigneeRepo.findAll();
}

/**
 * チケットを作成
 * @param formData フォームデータ
 * @returns 作成結果
 */
function createTicket(formData: {
  parentName: string;
  parentDescription: string;
  assignee: string;
  startDate: string;
  endDate: string;
}): { success: boolean; ticketCount?: number; error?: string } {
  try {
    const templateService = getTemplateService();
    const ticketService = getTicketService();

    // 日付をパース
    const startDate = DateUtils.parseDate(formData.startDate);
    const endDate = DateUtils.parseDate(formData.endDate);

    // 日付の検証
    if (startDate > endDate) {
      return { success: false, error: '開始日は終了日以前である必要があります' };
    }

    // テンプレートから展開
    const result = templateService.expandChildTickets({
      parentName: formData.parentName,
      parentDescription: formData.parentDescription,
      assignee: formData.assignee,
      startDate,
      endDate,
    });

    // 保存
    ticketService.saveTickets([result.parent, ...result.children]);

    const ticketCount = 1 + result.children.length;
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `${ticketCount}件のチケットを作成しました`,
      '作成完了',
      3
    );

    return { success: true, ticketCount };
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
 * ガントを生成
 * @param params 生成パラメータ
 * @returns 生成結果
 */
function generateGantt(params: {
  startDate: string;
  endDate: string;
}): { success: boolean; sheetName?: string; error?: string } {
  try {
    const ganttService = getGanttService();
    const settingsRepo = getSettingsRepository();

    // 日付をパース
    const startDate = DateUtils.parseDate(params.startDate);
    const endDate = DateUtils.parseDate(params.endDate);

    // 日付の検証
    if (startDate > endDate) {
      return { success: false, error: '開始日は終了日以前である必要があります' };
    }

    // ガントデータを生成
    const ganttData = ganttService.generateGantt({ startDate, endDate });

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
    const settings = settingsRepo.getSettings();
    sheet
      .getRange(1, 1, 1, ganttData.headers.length)
      .setFontWeight('bold')
      .setBackground(settings.headerBackgroundColor)
      .setHorizontalAlignment('center');

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
  resetSettings,
  showHelp,
  getAssigneeList,
  createTicket,
  generateGantt,
};
