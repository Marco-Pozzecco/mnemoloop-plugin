import { IReviewItem } from "./IReviewItem";

export interface IReviewQueue<Entity> {
  readonly items: IReviewItem<Entity>[];
  readonly position: number;
  readonly current: IReviewItem<Entity> | null;
  readonly size: number;
  next(): IReviewItem<Entity> | null;
  previous(): IReviewItem<Entity> | null;
}
