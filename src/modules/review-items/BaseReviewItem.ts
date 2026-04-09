import { IParser } from '@/interfaces/IParser';
import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { IReviewItem } from '@/interfaces/IReviewItem';

export abstract class BaseReviewItem<
	Entity extends EntityYaml,
	EntityYaml,
> implements IReviewItem<Entity> {
	protected _data: Entity | null = null;
	protected _filepath: string;
	protected _engine: IReviewEngine<EntityYaml>;
	private _parser: IParser<Entity, EntityYaml>;

	constructor(
		filepath: string,
		engine: IReviewEngine<EntityYaml>,
		parser: IParser<Entity, EntityYaml>,
	) {
		this._parser = parser;
		this._filepath = filepath;
		this._engine = engine;

		this.preload(this._filepath);
	}

	get data() {
		return this._data;
	}

	abstract review: <Score extends number>(score: Score) => void;

	preload: (filepath: string) => Promise<void> = async (filepath) => {
		const { entity } = await this._parser.parse(filepath);
		this._data = entity;
	};
}
