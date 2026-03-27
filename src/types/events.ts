import { Flashcard } from "@/schemas"
import { Rating } from "ts-fsrs"

export enum EventType {
  // review
  ReviewFlashcard = "REVIEW:FLASHCARD",
  // index
  IndexInit = "INDEX:INIT",
  IndexCreate = "INDEX:CREATE",
  IndexUpdate = "INDEX:UPDATE",
  IndexDelete = "INDEX:DELETE",
  // session
  SessionStart = "SESSION:START",
  SessionEnd = "SESSION:END",
  // queue
  QueueInit = "QUEUE:INIT",
}

export type EventData<Data> = {
  event_type: EventType
  created_at: Date
  data: Data
}

export type QueueInitEntity = {
  total_cards: number;
  due_today: number;
};

export type IndexData = {}

export type QueueInitEvent = EventData<QueueInitEntity>;
export type IndexInitEvent = EventData<IndexData>;
export type ReviewFlashcardEvent = EventData<Flashcard> & {
  filepath: string,
  rating: Rating
};

export type SessionStartEntity = {
  session_id: string;
  review_type: string;
  start_time: number;
};

export type SessionEndEntity = {
  session_id: string;
  review_type: string;
  date: string;
  start_time: number;
  end_time: number;
  total_count: number;
  correct_count: number;
  incorrect_count: number;
  duration_s: number;
};

export type SessionStartEvent = EventData<SessionStartEntity>;
export type SessionEndEvent = EventData<SessionEndEntity>;
