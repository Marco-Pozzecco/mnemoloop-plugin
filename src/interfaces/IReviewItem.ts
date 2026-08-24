export interface IReviewItem<Entity> {
	readonly data: Entity | null;
	readonly id: string;
	readonly filepath: string;
	review<Score extends number>(score: Score): void;
	restore(due: string | null, stability: number | null, difficulty: number | null): void;
	dispose(): void;
}
