import { EventData } from "@/types/events";

export interface ISubscriber<Entity extends Record<string, unknown>> {
  dispatch: (event: string, data: EventData<Entity>) => void;
}
