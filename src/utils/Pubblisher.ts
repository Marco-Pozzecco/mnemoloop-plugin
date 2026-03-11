import { IPubblisher } from "@/interfaces/IPubblisher";
import { ISubscriber } from "@/interfaces/ISubscriber";

export abstract class Pubblisher<EventType extends string, Data> implements IPubblisher<EventType, Data> {
  protected _subscribers: ISubscriber<EventType, Data>[] = [];

  constructor(subscribers: ISubscriber<EventType, Data>[]) {
    this._subscribers = subscribers;
  }

  subscribe: (subscriber: ISubscriber<EventType, Data>) => void = (subscriber) => {
    this._subscribers.push(subscriber);
  };

  unsubscribe: (subscriber: ISubscriber<EventType, Data>) => void = (subscriber) => {
    this._subscribers.remove(subscriber);
  };

  notify: (event: EventType, data: Data) => void = (event, data) => {
    this._subscribers.forEach(subscriber => subscriber.update(event, data))
  };
}
