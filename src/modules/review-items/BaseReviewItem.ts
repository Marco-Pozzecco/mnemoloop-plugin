import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { IReviewItem } from '@/interfaces/IReviewItem';

export abstract class BaseReviewItem<
	Entity extends EntityYaml,
	EntityYaml,
> implements IReviewItem<Entity> {
	protected _data: Entity | null = null;
	protected _filepath: string;
	protected _engine: IReviewEngine<EntityYaml>;
	protected _id: string;

	constructor(filepath: string, engine: IReviewEngine<EntityYaml>) {
		this._filepath = filepath;
		this._engine = engine;
		// Generate a unique ID from filepath and timestamp
		this._id = `${filepath}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	get id(): string {
		return this._id;
	}

	get data() {
		return this._data;
	}

	/**
	 * Restore the entity to a previous FSRS state (for undo)
	 */
	restore(due: string | null, stability: number | null, difficulty: number | null): void {
		if (!this._data) return;

		if (due !== null) {
			(this._data as unknown as Record<string, unknown>).due = due;
		}
		if (stability !== null) {
			(this._data as unknown as Record<string, unknown>).stability = stability;
		}
		if (difficulty !== null) {
			(this._data as unknown as Record<string, unknown>).difficulty = difficulty;
		}
	}

	abstract review: <Score extends number>(score: Score) => void;
	abstract dispose(): void;
}
