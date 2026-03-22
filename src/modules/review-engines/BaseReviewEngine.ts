import { IReviewEngine } from '@/interfaces/IReviewEngine';

export abstract class BaseReviewEngine<Entity> implements IReviewEngine<Entity> {
  abstract sort(list: Entity[]): Entity[];
  abstract calculate: (item: Entity, score: number) => Entity;
}
