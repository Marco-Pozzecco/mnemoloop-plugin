import { IReviewEngine } from "@/interfaces/IReviewEngine";
import { IReviewItem } from "@/interfaces/IReviewItem";
import { ISubscriber } from "@/interfaces/ISubscriber";
import { EventType } from "@/types/events";
import { Pubblisher } from "@/utils/Pubblisher";

export abstract class BaseReviewItem<Entity extends Record<string, unknown>> extends Pubblisher<Entity> implements IReviewItem<Entity> {
  private _data: Entity;
  private _filepath: string;
  private _engine: IReviewEngine<Entity>

  constructor(data: Entity, filepath: string, engine: IReviewEngine<Entity>, subscribers: ISubscriber<Entity>[]) {
    super(subscribers);
    this._data = data;
    this._filepath = filepath;
    this._engine = engine;
  }

  get data() {
    return this._data;
  }

  review: <Score extends number>(score: Score) => void = (score) => {
    this._data = this._engine.calculate(this._data, score);
    this.notify(EventType.Review, { entity: this._data, entity_id: this._filepath, created_at: new Date() })
  };
}
