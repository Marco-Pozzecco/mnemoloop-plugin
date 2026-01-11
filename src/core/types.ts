export interface PluginSettings {
  flashcardsDirectory: string;
  reviewIntervals: number[];
  baseEase: number;
}

export enum SRSState {
  New = "New",
  Learning = "Learning",
  Review = "Review",
  Relearning = "Relearning"
}

export interface SRSMeta {
  id: string;
  sourcePath: string;
  nextReview: string; // ISO Date
  interval: number;
  ease: number;
  state: SRSState;
}

export interface CardIndex {
  version: string;
  cards: Record<string, SRSMeta>;
}
