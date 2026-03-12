import { EventData, ISubscriber } from "@/interfaces/ISubscriber";

export abstract class Subscriber<Entity extends Record<string, unknown>> implements ISubscriber<Entity> {
  abstract update: (event: string, data: EventData<Entity>) => void;
}
