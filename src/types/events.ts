export enum EventType {
  // review
  Review = "REVIEW",
  // index  
  IndexCreate = "INDEX:CREATE",
  IndexUpdate = "INDEX:UPDATE",
  IndexDelete = "INDEX:DELETE",
  // session
  SessionStart = "SESSION:START",
  SessionEnd = "SESSION:END",
}

export type EventData<Entity> = {
  event_type: EventType
  entity_id: string
  created_at: Date
  entity: Entity
}
