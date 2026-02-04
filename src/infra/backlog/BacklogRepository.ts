import { Ticket } from '../../domain/models/Ticket';
import { TicketStatus, TicketType } from '../../types';
import { Assignee } from '../../domain/models/Assignee';
import { BacklogClient, BacklogIssue, BacklogUser, CreateIssueParams } from './BacklogClient';
import { BacklogConfig, getBacklogConfigFromProperties } from './BacklogConfig';
import { AppError } from '../../errors/AppError';
import { DateUtils } from '../../domain/utils/DateUtils';

/**
 * Backlogのステータスをアプリケーションのステータスにマッピング
 */
const STATUS_MAP: Record<string, TicketStatus> = {
  未対応: 'notStarted',
  処理中: 'inProgress',
  処理済み: 'completed',
  完了: 'completed',
};

/**
 * BacklogRepositoryクラス
 * Backlog APIからチケットデータを取得・作成する
 */
export class BacklogRepository {
  private client: BacklogClient;
  private userCache: Map<number, BacklogUser> | null = null;

  constructor(config?: BacklogConfig) {
    const effectiveConfig = config || getBacklogConfigFromProperties();
    if (!effectiveConfig) {
      throw new AppError(
        'E110',
        'Backlog設定が見つかりません。「チケット管理」→「Backlog設定」から設定してください'
      );
    }
    this.client = new BacklogClient(effectiveConfig);
  }

  /**
   * 接続テスト
   */
  testConnection(): boolean {
    return this.client.testConnection();
  }

  /**
   * プロジェクトメンバーを担当者リストとして取得
   */
  getAssignees(): Assignee[] {
    const users = this.client.getProjectUsers();
    this.userCache = new Map(users.map((u) => [u.id, u]));

    return users.map((user) => ({
      name: user.name,
      email: user.mailAddress,
    }));
  }

  /**
   * ユーザー名からユーザーIDを取得
   */
  private getUserIdByName(name: string): number | undefined {
    if (!this.userCache) {
      const users = this.client.getProjectUsers();
      this.userCache = new Map(users.map((u) => [u.id, u]));
    }

    for (const [id, user] of this.userCache) {
      if (user.name === name) {
        return id;
      }
    }
    return undefined;
  }

  /**
   * BacklogIssueをTicketに変換
   * @param issue Backlog課題
   * @param type チケットタイプ
   * @param parentIssueKey 親課題のissueKey（子チケットの場合に指定）
   */
  private convertToTicket(issue: BacklogIssue, type: TicketType, parentIssueKey?: string): Ticket {
    const status = STATUS_MAP[issue.status.name] || 'notStarted';

    return {
      id: issue.issueKey,
      parentId: parentIssueKey || null,
      type,
      name: issue.summary,
      description: issue.description || '',
      assignee: issue.assignee?.name || '',
      status,
      startDate: issue.startDate ? new Date(issue.startDate) : new Date(),
      endDate: issue.dueDate ? new Date(issue.dueDate) : new Date(),
      createdAt: new Date(issue.created),
    };
  }

  /**
   * 全チケットを取得
   */
  findAll(): Ticket[] {
    const issues = this.client.getIssues();
    return issues.map((issue) =>
      this.convertToTicket(issue, issue.parentIssueId ? 'child' : 'parent')
    );
  }

  /**
   * 親チケットIDに紐づく子チケットを取得
   */
  findByParentId(parentIssueId: number): Ticket[] {
    const result = this.client.getIssueWithChildren(parentIssueId);
    return result.children.map((issue) => this.convertToTicket(issue, 'child'));
  }

  /**
   * 期間内の親チケットとその子チケットを取得（ガント生成用）
   */
  findParentTicketsInRange(startDate: Date, endDate: Date): Ticket[] {
    const startStr = DateUtils.format(startDate, 'YYYY-MM-DD');
    const endStr = DateUtils.format(endDate, 'YYYY-MM-DD');

    const parentIssues = this.client.getParentIssuesInRange(startStr, endStr);

    const tickets: Ticket[] = [];

    for (const parent of parentIssues) {
      // 親チケット
      tickets.push(this.convertToTicket(parent, 'parent'));

      // 子チケット（親のissueKeyをparentIdとして設定）
      const children = this.client.getIssueWithChildren(parent.id).children;
      for (const child of children) {
        tickets.push(this.convertToTicket(child, 'child', parent.issueKey));
      }

      // レート制限対策
      Utilities.sleep(50);
    }

    return tickets;
  }

  /**
   * 親チケットを作成
   */
  createParentTicket(params: {
    name: string;
    description?: string;
    assignee: string;
    startDate: Date;
    endDate: Date;
  }): BacklogIssue {
    const assigneeId = this.getUserIdByName(params.assignee);

    const createParams: CreateIssueParams = {
      summary: params.name,
      description: params.description,
      startDate: DateUtils.format(params.startDate, 'YYYY-MM-DD'),
      dueDate: DateUtils.format(params.endDate, 'YYYY-MM-DD'),
      assigneeId,
    };

    return this.client.createIssue(createParams);
  }

  /**
   * 子チケットを作成
   */
  createChildTicket(params: {
    parentIssueId: number;
    name: string;
    description?: string;
    assignee: string;
    startDate: Date;
    endDate: Date;
  }): BacklogIssue {
    const assigneeId = this.getUserIdByName(params.assignee);

    const createParams: CreateIssueParams = {
      summary: params.name,
      description: params.description,
      startDate: DateUtils.format(params.startDate, 'YYYY-MM-DD'),
      dueDate: DateUtils.format(params.endDate, 'YYYY-MM-DD'),
      assigneeId,
      parentIssueId: params.parentIssueId,
    };

    return this.client.createIssue(createParams);
  }

  /**
   * 親チケットと子チケットを一括作成
   */
  createTicketsFromTemplate(params: {
    parentName: string;
    parentDescription?: string;
    assignee: string;
    startDate: Date;
    endDate: Date;
    children: Array<{
      name: string;
      description?: string;
      startDate: Date;
      endDate: Date;
    }>;
  }): { parent: BacklogIssue; children: BacklogIssue[] } {
    // 親チケット作成
    const parent = this.createParentTicket({
      name: params.parentName,
      description: params.parentDescription,
      assignee: params.assignee,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    // 子チケット作成
    const children: BacklogIssue[] = [];
    for (const child of params.children) {
      const childIssue = this.createChildTicket({
        parentIssueId: parent.id,
        name: child.name,
        description: child.description,
        assignee: params.assignee,
        startDate: child.startDate,
        endDate: child.endDate,
      });
      children.push(childIssue);

      // レート制限対策
      Utilities.sleep(100);
    }

    return { parent, children };
  }
}
