import { IEventListener } from "@/interfaces/IEventListener";
import { EventBus } from "@/modules/event-bus/EventBus";
import { EventData, EventType } from "@/types/events";

export abstract class EventListener implements IEventListener {
  protected abstract readonly eventTypes: EventType[];
  protected abstract process(event: EventData<unknown>): void;

  constructor() {
    EventBus.instance.subscribe(this.handleEvent.bind(this));
  }

  private handleEvent(event: EventData<unknown>): void {
    if (this.eventTypes.includes(event.event_type)) {
      this.process(event);
    }
  }

  dispose(): void {
    EventBus.instance.unsubscribe(this.handleEvent.bind(this));
  }
}
