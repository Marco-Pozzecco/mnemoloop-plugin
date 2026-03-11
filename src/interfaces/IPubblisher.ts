import { ISubscriber } from "./ISubscriber";

export interface IPubblisher<EventType extends string, Data> {
  subscribe: (subscriber: ISubscriber<EventType, Data>) => void;
  unsubscribe: (subscriber: ISubscriber<EventType, Data>) => void;
  notify: (event: EventType, data: Data) => void;
}
