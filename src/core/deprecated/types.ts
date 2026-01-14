export enum SRSState {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

export interface SRSMeta {
  id: string;
  sourcePath: string;
  nextReview: string;
  interval: number;
  ease: number;
  state: SRSState;
}

export interface CardIndex {
  version: string;
  cards: Record<string, SRSMeta>;
}
