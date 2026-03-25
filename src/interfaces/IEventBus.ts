import { EventData } from '@/types/events'

export interface IEventBus {
  subscribe(callback: (event: EventData<unknown>) => void): void
  unsubscribe(callback: (event: EventData<unknown>) => void): void
  publish(event: EventData<unknown>): void
}
