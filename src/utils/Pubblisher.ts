import { IPubblisher } from "@/interfaces/IPubblisher";
import { ISubscriber } from "@/interfaces/ISubscriber";
import { EventData } from "@/types/events";

export abstract class Pubblisher<Entity extends Record<string, unknown>> implements IPubblisher<Entity> {
  protected _subscribers: ISubscriber<Entity>[] = [];

  constructor(subscribers: ISubscriber<Entity>[]) {
    this._subscribers = subscribers;
  }

  subscribe: (subscriber: ISubscriber<Entity>) => void = (subscriber) => {
    this._subscribers.push(subscriber);
  };

  unsubscribe: (subscriber: ISubscriber<Entity>) => void = (subscriber) => {
    this._subscribers.remove(subscriber);
  };

  notify: (event: string, data: EventData<Entity>) => void = (event, data) => {
    this._subscribers.forEach(subscriber => subscriber.dispatch(event, data))
  };
}
