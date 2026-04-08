import { IParser } from '@/interfaces/IParser';
import { IReviewEngine } from '@/interfaces/IReviewEngine';
import { IReviewItem } from '@/interfaces/IReviewItem';

export abstract class BaseReviewItem<
	Entity extends EntityMetadata,
	EntityMetadata extends { file: string },
> implements IReviewItem<Entity> {
	protected _data: Entity | null = null;
	protected _filepath: string;
	protected _engine: IReviewEngine<EntityMetadata>;
	private _parser: IParser<Entity, EntityMetadata>;

	constructor(
		filepath: string,
		engine: IReviewEngine<EntityMetadata>,
		parser: IParser<Entity, EntityMetadata>,
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
		const { entity, error, success } = await this._parser.parse(filepath);
		if (!success) {
			throw error;
		}

		this._data = entity;
	};
}
