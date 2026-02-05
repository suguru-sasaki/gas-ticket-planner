import { SettingsRepository } from '../../infra/repositories/SettingsRepository';
import { STATUS_LABELS } from '../../types';
import { GanttRow } from '../models/GanttRow';
import { Ticket } from '../models/Ticket';
import { DateUtils } from '../utils/DateUtils';
import { HolidayService } from '../utils/HolidayService';

/**
 * ガントサービスが必要とするチケットリポジトリのインターフェース
 */
export interface IGanttTicketRepository {
  /** 期間内の親チケットを取得 */
  findParentsInPeriod(startDate: Date, endDate: Date): Ticket[];
  /** 親チケットIDから子チケットを取得 */
  findChildren(parentId: string): Ticket[];
}

/**
 * ガント生成入力
 */
export interface GenerateGanttInput {
  /** 表示開始日 */
  startDate: Date;
  /** 表示終了日 */
  endDate: Date;
  /** 説明文を含めるか */
  includeDescription?: boolean;
}

/**
 * ガント生成結果
 */
export interface GenerateGanttResult {
  /** ヘッダ行（日付） */
  headers: string[];
  /** データ行 */
  rows: GanttRowData[];
  /** 背景色情報 */
  backgrounds: string[][];
  /** ヘッダ行の背景色情報 */
  headerBackgrounds: string[];
  /** 日付範囲 */
  dateRange: Date[];
  /** 説明文を含むか */
  includeDescription: boolean;
}

/**
 * ガント行データ
 */
export interface GanttRowData {
  /** 親チケット名 */
  parentName: string;
  /** 子チケット名 */
  childName: string;
  /** 説明文 */
  description: string;
  /** 担当者 */
  assignee: string;
  /** 状態 */
  status: string;
  /** 開始日 */
  startDate: string;
  /** 終了日 */
  endDate: string;
  /** 日付セル（空文字または色付け用マーク） */
  dateCells: string[];
}

/**
 * ガントサービス
 * ガントチャートの生成を行う
 */
export class GanttService {
  constructor(
    private ticketRepository: IGanttTicketRepository,
    private settingsRepository: SettingsRepository
  ) {}

  /**
   * ガントチャートデータを生成
   * @param input 生成入力（フィルタ用期間）
   * @returns ガント生成結果
   */
  generateGantt(input: GenerateGanttInput): GenerateGanttResult {
    const includeDescription = input.includeDescription ?? false;

    // 対象チケットを取得（フィルタ期間内に重なる親チケット）
    const parentsUnsorted = this.ticketRepository.findParentsInPeriod(
      input.startDate,
      input.endDate
    );

    // 親チケットをソート（開始日 → 終了日 → ID）
    const parents = this.sortTickets(parentsUnsorted);

    // 対象がない場合は空の結果を返す
    if (parents.length === 0) {
      return {
        headers: this.generateHeaders([], includeDescription),
        rows: [],
        backgrounds: [],
        headerBackgrounds: [],
        dateRange: [],
        includeDescription,
      };
    }

    // ガント表示範囲を対象親チケット群のmin/maxから計算
    const dateRange = this.calculateGanttDateRange(parents);

    // 祝日リストを取得
    const holidays = dateRange.length > 0
      ? HolidayService.getHolidays(dateRange[0], dateRange[dateRange.length - 1])
      : [];

    // ヘッダ行を生成（固定カラム + 日付）
    const headers = this.generateHeaders(dateRange, includeDescription);

    // ヘッダ行の背景色を生成
    const headerBackgrounds = this.createHeaderBackgrounds(dateRange, holidays, includeDescription);

    // 行データと背景色を生成
    const rows: GanttRowData[] = [];
    const backgrounds: string[][] = [];

    // 現在日付（遅延判定用）
    const today = DateUtils.stripTime(new Date());

    for (const parent of parents) {
      // 親チケット行
      const parentRow = this.createParentRow(parent, dateRange, includeDescription);
      const parentBg = this.createRowBackground(parent, dateRange, true, holidays, today, includeDescription);
      rows.push(parentRow);
      backgrounds.push(parentBg);

      // 子チケット行（ソート済み）
      const childrenUnsorted = this.ticketRepository.findChildren(parent.id);
      const children = this.sortTickets(childrenUnsorted);
      for (const child of children) {
        const childRow = this.createChildRow(parent.name, child, dateRange, includeDescription);
        const childBg = this.createRowBackground(child, dateRange, false, holidays, today, includeDescription);
        rows.push(childRow);
        backgrounds.push(childBg);
      }
    }

    return {
      headers,
      rows,
      backgrounds,
      headerBackgrounds,
      dateRange,
      includeDescription,
    };
  }

  /**
   * GanttRowモデルの配列を生成（レガシー互換）
   */
  generateGanttRows(startDate: Date, endDate: Date, includeDescription = false): GanttRow[] {
    const parentsUnsorted = this.ticketRepository.findParentsInPeriod(startDate, endDate);

    // 対象がない場合は空配列を返す
    if (parentsUnsorted.length === 0) {
      return [];
    }

    // 親チケットをソート（開始日 → 終了日 → ID）
    const parents = this.sortTickets(parentsUnsorted);

    // ガント表示範囲を対象親チケット群のmin/maxから計算
    const dateRange = this.calculateGanttDateRange(parents);

    // 祝日リストを取得
    const holidays = dateRange.length > 0
      ? HolidayService.getHolidays(dateRange[0], dateRange[dateRange.length - 1])
      : [];

    // 現在日付（遅延判定用）
    const today = DateUtils.stripTime(new Date());

    const ganttRows: GanttRow[] = [];

    for (const parent of parents) {
      // 親チケット行
      ganttRows.push(this.ticketToGanttRow(parent, '', dateRange, holidays, today, includeDescription));

      // 子チケット行（ソート済み）
      const childrenUnsorted = this.ticketRepository.findChildren(parent.id);
      const children = this.sortTickets(childrenUnsorted);
      for (const child of children) {
        ganttRows.push(this.ticketToGanttRow(child, parent.name, dateRange, holidays, today, includeDescription));
      }
    }

    return ganttRows;
  }

  /**
   * ヘッダ行を生成
   */
  private generateHeaders(dateRange: Date[], includeDescription: boolean): string[] {
    const fixedHeaders = includeDescription
      ? ['親チケット名', '子チケット名', '説明文', '担当者', '状態', '開始日', '終了日']
      : ['親チケット名', '子チケット名', '担当者', '状態', '開始日', '終了日'];

    const dateHeaders = dateRange.map(date => DateUtils.format(date, 'M/D'));

    return [...fixedHeaders, ...dateHeaders];
  }

  /**
   * 固定列数を取得
   */
  private getFixedColumnCount(includeDescription: boolean): number {
    return includeDescription ? 7 : 6;
  }

  /**
   * ヘッダ行の背景色配列を作成
   */
  private createHeaderBackgrounds(dateRange: Date[], holidays: Date[] = [], includeDescription: boolean): string[] {
    const settings = this.settingsRepository.getSettings();
    const backgrounds: string[] = [];
    const fixedColumnCount = this.getFixedColumnCount(includeDescription);

    // 固定カラムはヘッダ背景色
    for (let i = 0; i < fixedColumnCount; i++) {
      backgrounds.push(settings.headerBackgroundColor);
    }

    // 日付カラム
    for (const date of dateRange) {
      const strippedDate = DateUtils.stripTime(date);
      const isSunday = DateUtils.isSunday(strippedDate);
      const isSaturday = DateUtils.isSaturday(strippedDate);
      const isHoliday = HolidayService.isHoliday(strippedDate, holidays);

      let bgColor = settings.headerBackgroundColor;

      if (isHoliday || isSunday) {
        // 祝日または日曜日
        bgColor = settings.sundayColor;
      } else if (isSaturday) {
        // 土曜日
        bgColor = settings.saturdayColor;
      }

      backgrounds.push(bgColor);
    }

    return backgrounds;
  }

  /**
   * 親チケット行を作成
   */
  private createParentRow(parent: Ticket, dateRange: Date[], includeDescription: boolean): GanttRowData {
    const dateCells = this.createDateCells(parent, dateRange);

    return {
      parentName: parent.name,
      childName: '',
      description: includeDescription ? parent.description : '',
      assignee: parent.assignee,
      status: STATUS_LABELS[parent.status],
      startDate: DateUtils.format(parent.startDate, 'YYYY/MM/DD'),
      endDate: DateUtils.format(parent.endDate, 'YYYY/MM/DD'),
      dateCells,
    };
  }

  /**
   * 子チケット行を作成
   */
  private createChildRow(
    parentName: string,
    child: Ticket,
    dateRange: Date[],
    includeDescription: boolean
  ): GanttRowData {
    const dateCells = this.createDateCells(child, dateRange);

    return {
      parentName,
      childName: child.name,
      description: includeDescription ? child.description : '',
      assignee: child.assignee,
      status: STATUS_LABELS[child.status],
      startDate: DateUtils.format(child.startDate, 'YYYY/MM/DD'),
      endDate: DateUtils.format(child.endDate, 'YYYY/MM/DD'),
      dateCells,
    };
  }

  /**
   * 日付セルを作成（空文字配列、色付けは背景で行う）
   */
  private createDateCells(_ticket: Ticket, dateRange: Date[]): string[] {
    return dateRange.map(() => '');
  }

  /**
   * 行の背景色配列を作成
   */
  private createRowBackground(
    ticket: Ticket,
    dateRange: Date[],
    isParent: boolean,
    holidays: Date[] = [],
    today: Date,
    includeDescription: boolean
  ): string[] {
    const settings = this.settingsRepository.getSettings();
    const backgrounds: string[] = [];
    const fixedColumnCount = this.getFixedColumnCount(includeDescription);

    // 固定カラムは白背景
    for (let i = 0; i < fixedColumnCount; i++) {
      backgrounds.push('#FFFFFF');
    }

    // 遅延判定（終了日を過ぎて完了していない）
    const ticketEndDate = DateUtils.stripTime(ticket.endDate);
    const isOverdue = ticket.status !== 'completed' && ticketEndDate < today;

    // 日付カラム
    for (const date of dateRange) {
      const strippedDate = DateUtils.stripTime(date);
      const isInRange = this.isDateInRange(strippedDate, ticket);
      const isSunday = DateUtils.isSunday(strippedDate);
      const isSaturday = DateUtils.isSaturday(strippedDate);
      const isHoliday = HolidayService.isHoliday(strippedDate, holidays);
      const isEndDate = strippedDate.getTime() === ticketEndDate.getTime();

      let bgColor = '#FFFFFF';

      if (isInRange) {
        // チケット期間内
        if (isOverdue && isEndDate) {
          // 遅延していて終了日の場合は遅延色
          bgColor = settings.overdueColor;
        } else {
          // 通常の状態色
          bgColor = this.settingsRepository.getTicketColor(
            isParent,
            STATUS_LABELS[ticket.status]
          );
        }
      } else if (isHoliday) {
        // 祝日（チケット期間外）
        bgColor = settings.holidayColor;
      } else if (isSunday) {
        // 日曜日（チケット期間外）
        bgColor = settings.sundayColor;
      } else if (isSaturday) {
        // 土曜日（チケット期間外）
        bgColor = settings.saturdayColor;
      }

      backgrounds.push(bgColor);
    }

    return backgrounds;
  }

  /**
   * 日付がチケット期間内かどうか判定
   */
  private isDateInRange(date: Date, ticket: Ticket): boolean {
    const ticketStart = DateUtils.stripTime(ticket.startDate);
    const ticketEnd = DateUtils.stripTime(ticket.endDate);
    return date >= ticketStart && date <= ticketEnd;
  }

  /**
   * 対象親チケット群からガント表示範囲を計算
   * @param parents 対象親チケット配列
   * @returns 日付範囲（min開始日〜max終了日）
   */
  private calculateGanttDateRange(parents: Ticket[]): Date[] {
    if (parents.length === 0) {
      return [];
    }

    // 全親チケットの最小開始日と最大終了日を計算
    let minStartDate = parents[0].startDate;
    let maxEndDate = parents[0].endDate;

    for (const parent of parents) {
      if (parent.startDate < minStartDate) {
        minStartDate = parent.startDate;
      }
      if (parent.endDate > maxEndDate) {
        maxEndDate = parent.endDate;
      }
    }

    return DateUtils.generateDateRange(minStartDate, maxEndDate);
  }

  /**
   * チケットをGanttRowモデルに変換
   */
  private ticketToGanttRow(
    ticket: Ticket,
    parentName: string,
    dateRange: Date[],
    holidays: Date[] = [],
    today: Date,
    includeDescription: boolean
  ): GanttRow {
    const isParent = ticket.type === 'parent';

    return {
      parentName: isParent ? ticket.name : parentName,
      childName: isParent ? '' : ticket.name,
      description: includeDescription ? ticket.description : '',
      assignee: ticket.assignee,
      status: STATUS_LABELS[ticket.status],
      startDate: ticket.startDate,
      endDate: ticket.endDate,
      dateCells: this.createDateCells(ticket, dateRange),
      backgroundColors: this.createRowBackground(ticket, dateRange, isParent, holidays, today, includeDescription),
    };
  }

  /**
   * チケットをソート
   * ソート順: 開始日昇順 → 終了日昇順 → ID昇順
   * @param tickets ソート対象のチケット配列
   * @returns ソート済みのチケット配列
   */
  private sortTickets(tickets: Ticket[]): Ticket[] {
    return [...tickets].sort((a, b) => {
      // 1. 開始日で比較（昇順）
      const startDateA = DateUtils.stripTime(a.startDate).getTime();
      const startDateB = DateUtils.stripTime(b.startDate).getTime();
      if (startDateA !== startDateB) {
        return startDateA - startDateB;
      }

      // 2. 開始日が同じ場合は終了日で比較（昇順）
      const endDateA = DateUtils.stripTime(a.endDate).getTime();
      const endDateB = DateUtils.stripTime(b.endDate).getTime();
      if (endDateA !== endDateB) {
        return endDateA - endDateB;
      }

      // 3. 終了日も同じ場合はIDで比較（昇順）
      return a.id.localeCompare(b.id);
    });
  }
}
