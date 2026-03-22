import { EventData } from "@/types/events";
import { ISubscriber } from "./ISubscriber";

export interface IPubblisher<Data extends Record<string, unknown>> {
  subscribe: (subscriber: ISubscriber<Data>) => void;
  unsubscribe: (subscriber: ISubscriber<Data>) => void;
  notify: (event: string, data: EventData<Data>) => void;
}
