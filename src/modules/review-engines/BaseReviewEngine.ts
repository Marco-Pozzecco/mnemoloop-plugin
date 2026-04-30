import { IReviewEngine } from '@/interfaces/IReviewEngine';

export abstract class BaseReviewEngine<Entity> implements IReviewEngine<Entity> {
	abstract sort<T extends Entity>(list: T[]): T[];
	abstract calculate<T extends Entity>(item: T, score: number): T;
}
