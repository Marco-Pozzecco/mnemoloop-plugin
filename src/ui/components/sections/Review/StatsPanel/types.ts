export interface StatsPanelStats {
  totalCards: number;
  cardsDueToday: number;
  newCards: number;
  cardsLearned: number;
  masteryLevel: number;
}

export default interface StatsPanelProps {
  stats?: StatsPanelStats;
  showActions?: boolean;
  onStartReview: () => void;
  onViewCards: () => void;
}
