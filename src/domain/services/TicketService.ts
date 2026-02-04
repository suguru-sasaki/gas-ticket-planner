import { AppError } from '../../errors/AppError';
import { AssigneeRepository } from '../../infra/repositories/AssigneeRepository';
import { TicketRepository } from '../../infra/repositories/TicketRepository';
import { TicketStatus, STATUS_LABELS } from '../../types';
import { Ticket } from '../models/Ticket';

/**
 * チケット作成入力
 */
export interface CreateTicketInput {
  /** 親チケットID（子チケットの場合） */
  parentId?: string;
  /** チケット名 */
  name: string;
  /** 説明 */
  description: string;
  /** 担当者名 */
  assignee: string;
  /** 開始日 */
  startDate: Date;
  /** 終了日 */
  endDate: Date;
}

/**
 * チケット更新入力
 */
export interface UpdateTicketInput {
  /** チケットID */
  id: string;
  /** チケット名 */
  name?: string;
  /** 説明 */
  description?: string;
  /** 担当者名 */
  assignee?: string;
  /** 状態 */
  status?: TicketStatus;
  /** 開始日 */
  startDate?: Date;
  /** 終了日 */
  endDate?: Date;
}

/**
 * チケットサービス
 * チケットの作成・更新・取得を行う
 */
export class TicketService {
  constructor(
    private ticketRepository: TicketRepository,
    private assigneeRepository: AssigneeRepository
  ) {}

  /**
   * 全チケットを取得
   */
  getAllTickets(): Ticket[] {
    return this.ticketRepository.findAll();
  }

  /**
   * 親チケットを取得
   */
  getParentTickets(): Ticket[] {
    return this.ticketRepository.findParents();
  }

  /**
   * 子チケットを取得
   * @param parentId 親チケットID（省略時は全子チケット）
   */
  getChildTickets(parentId?: string): Ticket[] {
    return this.ticketRepository.findChildren(parentId);
  }

  /**
   * IDでチケットを取得
   */
  getTicketById(id: string): Ticket | null {
    return this.ticketRepository.findById(id);
  }

  /**
   * 指定期間の親チケットを取得
   */
  getParentTicketsInPeriod(startDate: Date, endDate: Date): Ticket[] {
    return this.ticketRepository.findParentsInPeriod(startDate, endDate);
  }

  /**
   * チケットを作成
   */
  createTicket(input: CreateTicketInput): Ticket {
    // バリデーション
    this.validateTicketInput(input);

    const id = this.ticketRepository.getNextId();
    const isChild = !!input.parentId;

    // 子チケットの場合、親チケットの存在確認
    if (isChild) {
      const parent = this.ticketRepository.findById(input.parentId!);
      if (!parent) {
        throw new AppError('E004', `親チケット "${input.parentId}" が存在しません`);
      }
      if (parent.type !== 'parent') {
        throw new AppError('E004', `"${input.parentId}" は親チケットではありません`);
      }
    }

    const ticket: Ticket = {
      id,
      parentId: input.parentId || null,
      type: isChild ? 'child' : 'parent',
      name: input.name,
      description: input.description,
      assignee: input.assignee,
      status: 'notStarted',
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: new Date(),
    };

    this.ticketRepository.saveAll([ticket]);
    return ticket;
  }

  /**
   * チケットを一括保存
   */
  saveTickets(tickets: Ticket[]): void {
    // 各チケットのバリデーション
    for (const ticket of tickets) {
      if (!this.assigneeRepository.exists(ticket.assignee)) {
        throw new AppError('E003', `担当者 "${ticket.assignee}" が存在しません`);
      }
      if (ticket.endDate < ticket.startDate) {
        throw new AppError('E002', `チケット "${ticket.name}" の終了日が開始日より前です`);
      }
    }

    this.ticketRepository.saveAll(tickets);
  }

  /**
   * 入力バリデーション
   */
  private validateTicketInput(input: CreateTicketInput): void {
    if (!input.name || input.name.trim() === '') {
      throw new AppError('E001', 'チケット名は必須です');
    }

    if (!this.assigneeRepository.exists(input.assignee)) {
      throw new AppError('E003', `担当者 "${input.assignee}" が存在しません`);
    }

    if (input.endDate < input.startDate) {
      throw new AppError('E002', '終了日は開始日以降である必要があります');
    }
  }

  /**
   * 親チケットと紐づく子チケットを階層構造で取得
   */
  getTicketHierarchy(): Map<Ticket, Ticket[]> {
    const parents = this.ticketRepository.findParents();
    const hierarchy = new Map<Ticket, Ticket[]>();

    for (const parent of parents) {
      const children = this.ticketRepository.findChildren(parent.id);
      hierarchy.set(parent, children);
    }

    return hierarchy;
  }

  /**
   * ステータスラベルを取得
   */
  getStatusLabel(status: TicketStatus): string {
    return STATUS_LABELS[status];
  }
}
