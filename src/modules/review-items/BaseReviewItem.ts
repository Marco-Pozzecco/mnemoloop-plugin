import { IEngine } from "@/interfaces/IEngine";
import { IReviewItem } from "@/interfaces/IReviewItem";
import { ISubscriber } from "@/interfaces/ISubscriber";
import { Pubblisher } from "@/utils/Pubblisher";

export enum ReviewItemEvents {
  REVIEW = "REVIEW"
}

export abstract class BaseReviewItem<Entity extends Record<string, unknown>> extends Pubblisher<Entity> implements IReviewItem<Entity> {
  private _data: Entity;
  private _filepath: string;
  private _engine: IEngine<Entity>

  constructor(data: Entity, filepath: string, engine: IEngine<Entity>, subscribers: ISubscriber<Entity>[]) {
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
    this.notify(ReviewItemEvents.REVIEW, { entity: this._data, filepath: this._filepath })
  };
}
