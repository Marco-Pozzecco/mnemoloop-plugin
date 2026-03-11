import { ISubscriber } from "@/interfaces/ISubscriber";

export abstract class Subscriber<EventType extends string, Data> implements ISubscriber<EventType, Data> {
  abstract update: (event: EventType, data: Data) => void;
}
