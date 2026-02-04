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
 * Backlog設定をスクリプトプロパティから取得
 */
export function getBacklogConfigFromProperties(): BacklogConfig | null {
  const props = PropertiesService.getScriptProperties();
  const host = props.getProperty('BACKLOG_HOST');
  const apiKey = props.getProperty('BACKLOG_API_KEY');
  const projectId = props.getProperty('BACKLOG_PROJECT_ID');
  const issueTypeId = props.getProperty('BACKLOG_ISSUE_TYPE_ID');
  const priorityId = props.getProperty('BACKLOG_PRIORITY_ID');

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
 * Backlog設定をスクリプトプロパティに保存
 */
export function saveBacklogConfigToProperties(config: BacklogConfig): void {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('BACKLOG_HOST', config.host);
  props.setProperty('BACKLOG_API_KEY', config.apiKey);
  props.setProperty('BACKLOG_PROJECT_ID', config.projectId.toString());
  props.setProperty('BACKLOG_ISSUE_TYPE_ID', config.issueTypeId.toString());
  props.setProperty('BACKLOG_PRIORITY_ID', config.priorityId.toString());
}

/**
 * Backlog設定をクリア
 */
export function clearBacklogConfig(): void {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('BACKLOG_HOST');
  props.deleteProperty('BACKLOG_API_KEY');
  props.deleteProperty('BACKLOG_PROJECT_ID');
  props.deleteProperty('BACKLOG_ISSUE_TYPE_ID');
  props.deleteProperty('BACKLOG_PRIORITY_ID');
}
