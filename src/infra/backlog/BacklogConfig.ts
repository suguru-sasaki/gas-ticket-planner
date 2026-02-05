/**
 * Backlog接続設定
 */
export interface BacklogConfig {
  /** Backlogホスト（例: xxx.backlog.com） */
  host: string;
  /** APIキー */
  apiKey: string;
  /** プロジェクトID */
  projectId: number;
  /** 課題種別ID */
  issueTypeId: number;
  /** 優先度ID（デフォルト: 3 = 中） */
  priorityId: number;
}

/**
 * Backlog設定のデフォルト値
 */
export const DEFAULT_BACKLOG_CONFIG: Partial<BacklogConfig> = {
  priorityId: 3, // 中
};

/**
 * Backlog設定の検証
 */
export function validateBacklogConfig(config: Partial<BacklogConfig>): config is BacklogConfig {
  return !!(
    config.host &&
    config.apiKey &&
    config.projectId &&
    config.issueTypeId &&
    config.priorityId
  );
}

/**
 * Backlog設定をプロパティから取得
 * - APIキーはユーザープロパティ（ユーザー固有）
 * - その他はスクリプトプロパティ（共有設定）
 */
export function getBacklogConfigFromProperties(): BacklogConfig | null {
  const scriptProps = PropertiesService.getScriptProperties();
  const userProps = PropertiesService.getUserProperties();

  const host = scriptProps.getProperty('BACKLOG_HOST');
  const apiKey = userProps.getProperty('BACKLOG_API_KEY');
  const projectId = scriptProps.getProperty('BACKLOG_PROJECT_ID');
  const issueTypeId = scriptProps.getProperty('BACKLOG_ISSUE_TYPE_ID');
  const priorityId = scriptProps.getProperty('BACKLOG_PRIORITY_ID');

  if (!host || !apiKey || !projectId || !issueTypeId) {
    return null;
  }

  return {
    host,
    apiKey,
    projectId: parseInt(projectId, 10),
    issueTypeId: parseInt(issueTypeId, 10),
    priorityId: priorityId ? parseInt(priorityId, 10) : DEFAULT_BACKLOG_CONFIG.priorityId!,
  };
}

/**
 * Backlog設定をプロパティに保存
 * - APIキーはユーザープロパティ（ユーザー固有）
 * - その他はスクリプトプロパティ（共有設定）
 */
export function saveBacklogConfigToProperties(config: BacklogConfig): void {
  const scriptProps = PropertiesService.getScriptProperties();
  const userProps = PropertiesService.getUserProperties();

  scriptProps.setProperty('BACKLOG_HOST', config.host);
  userProps.setProperty('BACKLOG_API_KEY', config.apiKey);
  scriptProps.setProperty('BACKLOG_PROJECT_ID', config.projectId.toString());
  scriptProps.setProperty('BACKLOG_ISSUE_TYPE_ID', config.issueTypeId.toString());
  scriptProps.setProperty('BACKLOG_PRIORITY_ID', config.priorityId.toString());
}

/**
 * Backlog設定をクリア
 * - APIキーはユーザープロパティから削除
 * - その他はスクリプトプロパティから削除
 */
export function clearBacklogConfig(): void {
  const scriptProps = PropertiesService.getScriptProperties();
  const userProps = PropertiesService.getUserProperties();

  scriptProps.deleteProperty('BACKLOG_HOST');
  userProps.deleteProperty('BACKLOG_API_KEY');
  scriptProps.deleteProperty('BACKLOG_PROJECT_ID');
  scriptProps.deleteProperty('BACKLOG_ISSUE_TYPE_ID');
  scriptProps.deleteProperty('BACKLOG_PRIORITY_ID');
}
