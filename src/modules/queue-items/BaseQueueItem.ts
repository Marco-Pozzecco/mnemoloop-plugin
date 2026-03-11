import { IEngine } from "@/interfaces/IEngine";
import { IQueueItem } from "@/interfaces/IQueueItem";

export abstract class BaseQueueItem<Entity> implements IQueueItem<Entity> {
  private _data: Entity;
  private _engine: IEngine<Entity>

  constructor(data: Entity, engine: IEngine<Entity>) {
    this._data = data;
    this._engine = engine;
  }

  get data() {
    return this._data;
  }

  review: <Score extends number>(score: Score) => void = (score) => {
    this._data = this._engine.calculate(this._data, score);
  };
}
