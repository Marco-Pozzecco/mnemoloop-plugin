import { IReviewEngine } from "@/interfaces/IReviewEngine";
import { IReviewItem } from "@/interfaces/IReviewItem";
import { EventType } from "@/types/events";
import { EventBus } from '@/modules/event-bus/EventBus'

export abstract class BaseReviewItem<Entity extends Record<string, unknown>> implements IReviewItem<Entity> {
  private _data: Entity;
  private _filepath: string;
  private _engine: IReviewEngine<Entity>

  constructor(data: Entity, filepath: string, engine: IReviewEngine<Entity>) {
    this._data = data;
    this._filepath = filepath;
    this._engine = engine;
  }

  get data() {
    return this._data;
  }

  review: <Score extends number>(score: Score) => void = (score) => {
    this._data = this._engine.calculate(this._data, score);
    EventBus.instance.publish({
      event_type: EventType.Review,
      entity_id: this._filepath,
      created_at: new Date(),
      entity: this._data
    })
  };
}
