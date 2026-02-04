import { SettingsRepository } from '../../infra/repositories/SettingsRepository';
import { STATUS_LABELS } from '../../types';
import { GanttRow } from '../models/GanttRow';
import { Ticket } from '../models/Ticket';
import { DateUtils } from '../utils/DateUtils';
import { HolidayService } from '../utils/HolidayService';
import { MemoExtractor } from '../utils/MemoExtractor';

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
}

/**
 * ガント行データ
 */
export interface GanttRowData {
  /** 親チケット名 */
  parentName: string;
  /** 子チケット名 */
  childName: string;
  /** メモ */
  memo: string;
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
    // 対象チケットを取得（フィルタ期間内に重なる親チケット）
    const parents = this.ticketRepository.findParentsInPeriod(
      input.startDate,
      input.endDate
    );

    // 対象がない場合は空の結果を返す
    if (parents.length === 0) {
      return {
        headers: this.generateHeaders([]),
        rows: [],
        backgrounds: [],
        headerBackgrounds: [],
        dateRange: [],
      };
    }

    // ガント表示範囲を対象親チケット群のmin/maxから計算
    const dateRange = this.calculateGanttDateRange(parents);

    // 祝日リストを取得
    const holidays = dateRange.length > 0
      ? HolidayService.getHolidays(dateRange[0], dateRange[dateRange.length - 1])
      : [];

    // ヘッダ行を生成（固定カラム + 日付）
    const headers = this.generateHeaders(dateRange);

    // ヘッダ行の背景色を生成
    const headerBackgrounds = this.createHeaderBackgrounds(dateRange, holidays);

    // 行データと背景色を生成
    const rows: GanttRowData[] = [];
    const backgrounds: string[][] = [];

    for (const parent of parents) {
      // 親チケット行
      const parentRow = this.createParentRow(parent, dateRange);
      const parentBg = this.createRowBackground(parent, dateRange, true, holidays);
      rows.push(parentRow);
      backgrounds.push(parentBg);

      // 子チケット行
      const children = this.ticketRepository.findChildren(parent.id);
      for (const child of children) {
        const childRow = this.createChildRow(parent.name, child, dateRange);
        const childBg = this.createRowBackground(child, dateRange, false, holidays);
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
    };
  }

  /**
   * GanttRowモデルの配列を生成（レガシー互換）
   */
  generateGanttRows(startDate: Date, endDate: Date): GanttRow[] {
    const parents = this.ticketRepository.findParentsInPeriod(startDate, endDate);

    // 対象がない場合は空配列を返す
    if (parents.length === 0) {
      return [];
    }

    // ガント表示範囲を対象親チケット群のmin/maxから計算
    const dateRange = this.calculateGanttDateRange(parents);

    // 祝日リストを取得
    const holidays = dateRange.length > 0
      ? HolidayService.getHolidays(dateRange[0], dateRange[dateRange.length - 1])
      : [];

    const ganttRows: GanttRow[] = [];

    for (const parent of parents) {
      // 親チケット行
      ganttRows.push(this.ticketToGanttRow(parent, '', dateRange, holidays));

      // 子チケット行
      const children = this.ticketRepository.findChildren(parent.id);
      for (const child of children) {
        ganttRows.push(this.ticketToGanttRow(child, parent.name, dateRange, holidays));
      }
    }

    return ganttRows;
  }

  /**
   * ヘッダ行を生成
   */
  private generateHeaders(dateRange: Date[]): string[] {
    const fixedHeaders = [
      '親チケット名',
      '子チケット名',
      'メモ',
      '担当者',
      '状態',
      '開始日',
      '終了日',
    ];

    const dateHeaders = dateRange.map(date => DateUtils.format(date, 'M/D'));

    return [...fixedHeaders, ...dateHeaders];
  }

  /**
   * ヘッダ行の背景色配列を作成
   */
  private createHeaderBackgrounds(dateRange: Date[], holidays: Date[] = []): string[] {
    const settings = this.settingsRepository.getSettings();
    const backgrounds: string[] = [];

    // 固定カラム（7列）はヘッダ背景色
    for (let i = 0; i < 7; i++) {
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
  private createParentRow(parent: Ticket, dateRange: Date[]): GanttRowData {
    const dateCells = this.createDateCells(parent, dateRange);

    return {
      parentName: parent.name,
      childName: '',
      memo: MemoExtractor.extract(parent.description),
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
    dateRange: Date[]
  ): GanttRowData {
    const dateCells = this.createDateCells(child, dateRange);

    return {
      parentName,
      childName: child.name,
      memo: MemoExtractor.extract(child.description),
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
    holidays: Date[] = []
  ): string[] {
    const settings = this.settingsRepository.getSettings();
    const backgrounds: string[] = [];

    // 固定カラム（7列）は白背景
    for (let i = 0; i < 7; i++) {
      backgrounds.push('#FFFFFF');
    }

    // 日付カラム
    const today = DateUtils.stripTime(new Date());

    for (const date of dateRange) {
      const strippedDate = DateUtils.stripTime(date);
      const isInRange = this.isDateInRange(strippedDate, ticket);
      const isToday = strippedDate.getTime() === today.getTime();
      const isSunday = DateUtils.isSunday(strippedDate);
      const isSaturday = DateUtils.isSaturday(strippedDate);
      const isHoliday = HolidayService.isHoliday(strippedDate, holidays);

      let bgColor = '#FFFFFF';

      if (isInRange) {
        // チケット期間内（最優先）
        bgColor = this.settingsRepository.getTicketColor(
          isParent,
          STATUS_LABELS[ticket.status]
        );
      } else if (isToday) {
        // 今日の日付（チケット期間外）
        bgColor = settings.todayColor;
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
    holidays: Date[] = []
  ): GanttRow {
    const isParent = ticket.type === 'parent';

    return {
      parentName: isParent ? ticket.name : parentName,
      childName: isParent ? '' : ticket.name,
      memo: MemoExtractor.extract(ticket.description),
      assignee: ticket.assignee,
      status: STATUS_LABELS[ticket.status],
      startDate: ticket.startDate,
      endDate: ticket.endDate,
      dateCells: this.createDateCells(ticket, dateRange),
      backgroundColors: this.createRowBackground(ticket, dateRange, isParent, holidays),
    };
  }
}
