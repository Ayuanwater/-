
export type UserState = '我有点慌' | '我不知道该怎么选' | '钱的事让我压力很大' | '我想慢慢想，不急' | '';
export type ProblemCategory = '账单/欠费' | '吃饭/出行/日常花销' | '工作/时间安排' | '其他/说不清' | '';

export interface DecisionContext {
  state: UserState;
  category: ProblemCategory;
  language: string;
  mode: 'text' | 'voice';
}

export interface DecisionCard {
  title: string;
  content?: string;
  items?: string[];
}

export interface DecisionResponse {
  cards: DecisionCard[];
}

export enum AppStep {
  WELCOME = 0,
  SELECT_STATE = 1,
  SELECT_CATEGORY = 2,
  INPUT_PROBLEM = 3,
  LOADING = 4,
  RESULT = 5
}
