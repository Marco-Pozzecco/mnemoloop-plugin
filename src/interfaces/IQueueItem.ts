export interface IQueueItem<Entity> {
  readonly data: Entity;
  review: <Score extends number>(score: Score) => void;
}
