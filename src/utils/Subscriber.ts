import { ISubscriber } from "@/interfaces/ISubscriber";
import { EventData } from "@/types/events";

export abstract class Subscriber<Entity extends Record<string, unknown>> implements ISubscriber<Entity> {
  abstract dispatch: (event: string, data: EventData<Entity>) => void;
}
