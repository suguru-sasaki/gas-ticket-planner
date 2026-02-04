import { AppError } from '../../errors/AppError';
import { AssigneeRepository } from '../../infra/repositories/AssigneeRepository';
import { TemplateRepository } from '../../infra/repositories/TemplateRepository';
import { TicketRepository } from '../../infra/repositories/TicketRepository';
import { Template } from '../models/Template';
import { Ticket } from '../models/Ticket';
import { DateUtils } from '../utils/DateUtils';

/**
 * 子チケット展開入力
 */
export interface ExpandChildTicketsInput {
  /** 親チケット名 */
  parentName: string;
  /** 親チケット説明 */
  parentDescription: string;
  /** 担当者名 */
  assignee: string;
  /** 親チケット開始日 */
  startDate: Date;
}

/**
 * 子チケット展開結果
 */
export interface ExpandChildTicketsResult {
  /** 親チケット */
  parent: Ticket;
  /** 子チケット配列 */
  children: Ticket[];
}

/**
 * テンプレートサービス
 * テンプレートから子チケットを展開する
 */
export class TemplateService {
  constructor(
    private templateRepository: TemplateRepository,
    private ticketRepository: TicketRepository,
    private assigneeRepository: AssigneeRepository
  ) {}

  /**
   * テンプレートから親チケットと子チケットを展開
   * @param input 展開入力
   * @returns 展開結果（親チケットと子チケット配列）
   */
  expandChildTickets(input: ExpandChildTicketsInput): ExpandChildTicketsResult {
    // 担当者存在チェック
    if (!this.assigneeRepository.exists(input.assignee)) {
      throw new AppError('E003', `担当者 "${input.assignee}" が存在しません`);
    }

    // テンプレート取得
    const templates = this.templateRepository.findAll();
    if (templates.length === 0) {
      throw new AppError('E006', 'テンプレートが登録されていません');
    }

    // ID生成（親チケット + 子チケット分）
    const ids = this.ticketRepository.generateIds(1 + templates.length);
    const parentId = ids[0];
    const childIds = ids.slice(1);

    const now = new Date();

    // 親チケット終了日を計算（最後の子チケットの終了日）
    const parentEndDate = this.calculateParentEndDate(input.startDate, templates);

    // 親チケット作成
    const parent: Ticket = {
      id: parentId,
      parentId: null,
      type: 'parent',
      name: input.parentName,
      description: input.parentDescription,
      assignee: input.assignee,
      status: 'notStarted',
      startDate: input.startDate,
      endDate: parentEndDate,
      createdAt: now,
    };

    // 子チケット作成
    const children = templates.map((template, index) =>
      this.createChildTicket(
        childIds[index],
        parentId,
        template,
        input.startDate,
        input.assignee,
        now
      )
    );

    return { parent, children };
  }

  /**
   * 親チケットの終了日を計算
   */
  private calculateParentEndDate(startDate: Date, templates: Template[]): Date {
    let maxEndOffset = 0;

    for (const template of templates) {
      const endOffset = template.startOffset + template.duration - 1;
      if (endOffset > maxEndOffset) {
        maxEndOffset = endOffset;
      }
    }

    return DateUtils.addDays(startDate, maxEndOffset);
  }

  /**
   * 子チケットを作成
   */
  private createChildTicket(
    id: string,
    parentId: string,
    template: Template,
    parentStartDate: Date,
    assignee: string,
    createdAt: Date
  ): Ticket {
    const startDate = DateUtils.addDays(parentStartDate, template.startOffset);
    const endDate = DateUtils.addDays(startDate, template.duration - 1);

    return {
      id,
      parentId,
      type: 'child',
      name: template.name,
      description: template.description,
      assignee,
      status: 'notStarted',
      startDate,
      endDate,
      createdAt,
    };
  }
}
