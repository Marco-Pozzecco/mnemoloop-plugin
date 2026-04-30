export interface IReviewEngine<Entity> {
	sort<T extends Entity>(list: T[]): T[];
	calculate<T extends Entity>(item: T, score: number): T;
}
