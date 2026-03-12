export type EventData<T> = {
  filepath: string | undefined;
  entity: T
}

export interface ISubscriber<Entity extends Record<string, unknown>> {
  update: (event: string, data: EventData<Entity>) => void;
}
