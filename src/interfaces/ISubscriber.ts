export interface ISubscriber<EventType extends string, Data> {
  update: (event: EventType, data: Data) => void;
}
