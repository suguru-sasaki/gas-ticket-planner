import { BacklogConfig } from './BacklogConfig';
import { AppError } from '../../errors/AppError';

/**
 * Backlog課題の型定義
 */
export interface BacklogIssue {
  id: number;
  projectId: number;
  issueKey: string;
  keyId: number;
  issueType: {
    id: number;
    projectId: number;
    name: string;
    color: string;
  };
  summary: string;
  description: string | null;
  priority: {
    id: number;
    name: string;
  };
  status: {
    id: number;
    projectId: number;
    name: string;
    color: string;
  };
  assignee: {
    id: number;
    userId: string;
    name: string;
    mailAddress: string;
  } | null;
  startDate: string | null;
  dueDate: string | null;
  parentIssueId: number | null;
  created: string;
  updated: string;
}

/**
 * Backlogプロジェクトの型定義
 */
export interface BacklogProject {
  id: number;
  projectKey: string;
  name: string;
  chartEnabled: boolean;
  subtaskingEnabled: boolean;
  archived: boolean;
}

/**
 * Backlog課題種別の型定義
 */
export interface BacklogIssueType {
  id: number;
  projectId: number;
  name: string;
  color: string;
}

/**
 * Backlog優先度の型定義
 */
export interface BacklogPriority {
  id: number;
  name: string;
}

/**
 * Backlogユーザーの型定義
 */
export interface BacklogUser {
  id: number;
  userId: string;
  name: string;
  mailAddress: string;
}

/**
 * 課題作成パラメータ
 */
export interface CreateIssueParams {
  summary: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  assigneeId?: number;
  parentIssueId?: number;
}

/**
 * 課題検索パラメータ
 */
export interface SearchIssueParams {
  statusId?: number[];
  assigneeId?: number[];
  dueDateSince?: string;
  dueDateUntil?: string;
  keyword?: string;
  parentIssueId?: number[];
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Backlog APIクライアント
 */
export class BacklogClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly projectId: number;
  private readonly issueTypeId: number;
  private readonly priorityId: number;

  constructor(config: BacklogConfig) {
    this.baseUrl = `https://${config.host}`;
    this.apiKey = config.apiKey;
    this.projectId = config.projectId;
    this.issueTypeId = config.issueTypeId;
    this.priorityId = config.priorityId;
  }

  /**
   * APIエンドポイントURLを構築
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    let url = `${this.baseUrl}/api/v2${endpoint}?apiKey=${this.apiKey}`;
    if (params) {
      const queryString = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      if (queryString) {
        url += '&' + queryString;
      }
    }
    return url;
  }

  /**
   * 配列パラメータを含むURLを構築
   */
  private buildUrlWithArrayParams(
    endpoint: string,
    params?: Record<string, string | number | boolean | (string | number)[]>
  ): string {
    let url = `${this.baseUrl}/api/v2${endpoint}?apiKey=${this.apiKey}`;
    if (params) {
      const queryParts: string[] = [];
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const item of value) {
            queryParts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(item))}`);
          }
        } else {
          queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
      }
      if (queryParts.length > 0) {
        url += '&' + queryParts.join('&');
      }
    }
    return url;
  }

  /**
   * GETリクエスト
   */
  private get<T>(endpoint: string, params?: Record<string, string | number | boolean>): T {
    const url = this.buildUrl(endpoint, params);
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'get',
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(url, options);
    return this.handleResponse<T>(response);
  }

  /**
   * 配列パラメータを含むGETリクエスト
   */
  private getWithArrayParams<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | (string | number)[]>
  ): T {
    const url = this.buildUrlWithArrayParams(endpoint, params);
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'get',
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(url, options);
    return this.handleResponse<T>(response);
  }

  /**
   * POSTリクエスト
   */
  private post<T>(endpoint: string, payload: Record<string, string | number>): T {
    const url = `${this.baseUrl}/api/v2${endpoint}?apiKey=${this.apiKey}`;

    // ペイロードをフォームエンコード形式の文字列に変換
    const formData = Object.entries(payload)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: formData,
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(url, options);
    return this.handleResponse<T>(response, 201);
  }

  /**
   * レスポンスハンドリング
   */
  private handleResponse<T>(
    response: GoogleAppsScript.URL_Fetch.HTTPResponse,
    expectedCode: number = 200
  ): T {
    const code = response.getResponseCode();
    const body = response.getContentText();

    if (code === expectedCode) {
      return JSON.parse(body) as T;
    }

    if (code === 401) {
      throw new AppError('E101', 'Backlog認証エラー: APIキーが無効です');
    }
    if (code === 403) {
      throw new AppError('E102', 'Backlogアクセス権限エラー: プロジェクトへのアクセス権がありません');
    }
    if (code === 404) {
      throw new AppError('E103', 'Backlogリソースが見つかりません');
    }
    if (code === 429) {
      throw new AppError('E104', 'Backlog APIレート制限に達しました。しばらく待ってから再試行してください');
    }

    throw new AppError('E100', `Backlog APIエラー (${code}): ${body}`);
  }

  /**
   * 接続テスト
   */
  testConnection(): boolean {
    try {
      this.get<BacklogProject>(`/projects/${this.projectId}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * プロジェクト情報を取得
   */
  getProject(): BacklogProject {
    return this.get<BacklogProject>(`/projects/${this.projectId}`);
  }

  /**
   * プロジェクトの課題種別一覧を取得
   */
  getIssueTypes(): BacklogIssueType[] {
    return this.get<BacklogIssueType[]>(`/projects/${this.projectId}/issueTypes`);
  }

  /**
   * 優先度一覧を取得
   */
  getPriorities(): BacklogPriority[] {
    return this.get<BacklogPriority[]>('/priorities');
  }

  /**
   * プロジェクトメンバー一覧を取得
   */
  getProjectUsers(): BacklogUser[] {
    return this.get<BacklogUser[]>(`/projects/${this.projectId}/users`);
  }

  /**
   * 課題を作成
   */
  createIssue(params: CreateIssueParams): BacklogIssue {
    const payload: Record<string, string | number> = {
      projectId: this.projectId,
      summary: params.summary,
      issueTypeId: this.issueTypeId,
      priorityId: this.priorityId,
    };

    if (params.description) {
      payload.description = params.description;
    }
    if (params.startDate) {
      payload.startDate = params.startDate;
    }
    if (params.dueDate) {
      payload.dueDate = params.dueDate;
    }
    if (params.assigneeId) {
      payload.assigneeId = params.assigneeId;
    }
    if (params.parentIssueId) {
      payload.parentIssueId = params.parentIssueId;
    }

    return this.post<BacklogIssue>('/issues', payload);
  }

  /**
   * 課題一覧を取得
   */
  getIssues(params?: SearchIssueParams): BacklogIssue[] {
    const allIssues: BacklogIssue[] = [];
    let offset = 0;
    const count = 100;

    while (true) {
      const queryParams: Record<string, string | number | boolean | (string | number)[]> = {
        projectId: [this.projectId],
        count,
        offset,
      };

      if (params) {
        if (params.statusId) queryParams.statusId = params.statusId;
        if (params.assigneeId) queryParams.assigneeId = params.assigneeId;
        if (params.dueDateSince) queryParams.dueDateSince = params.dueDateSince;
        if (params.dueDateUntil) queryParams.dueDateUntil = params.dueDateUntil;
        if (params.keyword) queryParams.keyword = params.keyword;
        if (params.parentIssueId) queryParams.parentIssueId = params.parentIssueId;
        if (params.sort) queryParams.sort = params.sort;
        if (params.order) queryParams.order = params.order;
      }

      const issues = this.getWithArrayParams<BacklogIssue[]>('/issues', queryParams);
      allIssues.push(...issues);

      if (issues.length < count) {
        break;
      }

      offset += count;
      Utilities.sleep(100); // レート制限対策
    }

    return allIssues;
  }

  /**
   * 課題を取得
   */
  getIssue(issueIdOrKey: number | string): BacklogIssue {
    return this.get<BacklogIssue>(`/issues/${issueIdOrKey}`);
  }

  /**
   * 親課題とその子課題を取得
   */
  getIssueWithChildren(parentIssueId: number): { parent: BacklogIssue; children: BacklogIssue[] } {
    const parent = this.getIssue(parentIssueId);
    const children = this.getWithArrayParams<BacklogIssue[]>('/issues', {
      projectId: [this.projectId],
      parentIssueId: [parentIssueId],
      count: 100,
    });

    return { parent, children };
  }

  /**
   * 期間内の親課題を取得（ガント生成用）
   */
  getParentIssuesInRange(startDate: string, endDate: string): BacklogIssue[] {
    // 親課題のみを取得（parentIssueIdがnull）
    // 期間内: 開始日 <= endDate AND 終了日 >= startDate
    const allIssues = this.getIssues({
      sort: 'dueDate',
      order: 'asc',
    });

    return allIssues.filter((issue) => {
      // 親課題のみ
      if (issue.parentIssueId !== null) return false;

      // 期間判定
      const issueStart = issue.startDate;
      const issueEnd = issue.dueDate;

      if (!issueStart || !issueEnd) return false;

      return issueStart <= endDate && issueEnd >= startDate;
    });
  }
}
