import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { IReviewItem } from '@/interfaces/IReviewItem';

export abstract class BaseReviewItem<
	Entity extends Record<string, unknown>,
> implements IReviewItem<Entity> {
	protected _data: Entity;
	protected _filepath: string;
	protected _engine: IReviewEngine<Entity>;

	constructor(data: Entity, filepath: string, engine: IReviewEngine<Entity>) {
		this._data = data;
		this._filepath = filepath;
		this._engine = engine;
	}

	get data() {
		return this._data;
	}

	abstract review: <Score extends number>(score: Score) => void;
}
