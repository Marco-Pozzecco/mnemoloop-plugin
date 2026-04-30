import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { IReviewItem } from '@/interfaces/IReviewItem';

export abstract class BaseReviewItem<
	Entity extends EntityYaml,
	EntityYaml,
> implements IReviewItem<Entity> {
	protected _data: Entity | null = null;
	protected _filepath: string;
	protected _engine: IReviewEngine<EntityYaml>;

	constructor(filepath: string, engine: IReviewEngine<EntityYaml>) {
		this._filepath = filepath;
		this._engine = engine;
	}

	get data() {
		return this._data;
	}

	abstract review: <Score extends number>(score: Score) => void;
}
