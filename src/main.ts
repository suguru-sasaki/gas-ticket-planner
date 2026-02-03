/**
 * GAS Ticket Planner - エントリポイント
 *
 * Google Apps Script のエントリポイント。
 * グローバル関数として公開される関数を定義する。
 */

// ============================================================
// グローバル関数（GASから直接呼び出される）
// ============================================================

/**
 * スプレッドシートを開いた時に実行される
 * カスタムメニューを作成する
 */
function onOpen(): void {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('チケット管理')
    .addItem('チケット作成...', 'showCreateTicketDialog')
    .addSeparator()
    .addItem('ガント生成...', 'showGanttDialog')
    .addSeparator()
    .addItem('設定を初期化', 'resetSettings')
    .addItem('ヘルプ', 'showHelp')
    .addToUi();
}

/**
 * チケット作成ダイアログを表示
 */
function showCreateTicketDialog(): void {
  const html = HtmlService.createHtmlOutputFromFile('create-ticket')
    .setWidth(500)
    .setHeight(500);
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
    // TODO: SettingsRepository.resetToDefault() を呼び出す
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '設定を初期化しました',
      '完了',
      3
    );
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
  // TODO: AssigneeRepository.findAll() を呼び出す
  return [];
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
}): { success: boolean; tickets?: unknown[]; error?: string } {
  try {
    // TODO: UiController.createTicket() を呼び出す
    console.log('Creating ticket:', formData);
    return { success: true, tickets: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : '予期せぬエラー';
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
    // TODO: UiController.generateGantt() を呼び出す
    console.log('Generating gantt:', params);
    return { success: true, sheetName: 'ガント_20240110_153045' };
  } catch (error) {
    const message = error instanceof Error ? error.message : '予期せぬエラー';
    return { success: false, error: message };
  }
}
