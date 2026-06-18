/** 關鍵字抽獎贈品類型 */
export const KeywordPrizeType = {
  Product: 'product',
  Points: 'points',
} as const;

export type KeywordPrizeType = (typeof KeywordPrizeType)[keyof typeof KeywordPrizeType];

/** 關鍵字抽獎狀態 */
export const KeywordLotteryStatus = {
  NotStarted: 'not_started',
  InProgress: 'in_progress',
  Ended: 'ended',
} as const;

export type KeywordLotteryStatus = (typeof KeywordLotteryStatus)[keyof typeof KeywordLotteryStatus];

/** 列表 row 形狀 */
export interface KeywordLotteryRow {
  id: string;
  sessionName: string;
  keyword: string;
  startAt: string;
  endAt: string;
  prizeType: KeywordPrizeType;
  prizeContent: string;
  winnerCount: number;
  status: KeywordLotteryStatus;
  createdAt: string;
}
