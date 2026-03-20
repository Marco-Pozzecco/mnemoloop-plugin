export interface IReviewItem<Entity> {
  readonly data: Entity;
  review: <Score extends number>(score: Score) => void;
}
