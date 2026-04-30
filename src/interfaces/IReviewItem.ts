export interface IReviewItem<Entity> {
	readonly data: Entity | null;
	review: <Score extends number>(score: Score) => void;
}
