import { Flashcard } from '@/schemas';
import { Rating } from 'ts-fsrs';
import { AdapterEventType } from './adapters';
import { IndexEventType } from './indexes';
import { WatcherEventType } from './watcher';

export const EventType = {
	// review
	ReviewFlashcard: 'REVIEW:FLASHCARD',
	// session
	SessionStart: 'SESSION:START',
	SessionEnd: 'SESSION:END',
	// queue
	QueueInit: 'QUEUE:INIT',
	...AdapterEventType,
	...IndexEventType,
	...WatcherEventType,
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

export type EventData<Data> = {
	event_type: EventType;
	created_at: Date;
	data: Data;
};

export type QueueInitEntity = {
	total_cards: number;
	due_today: number;
};

export type FlashcardIndexInitEntity = {
	total_cards: number;
	due_today: number;
};

export type FlashcardIndexInitEvent = EventData<FlashcardIndexInitEntity>;

export type IndexInitEvent<Entity> = EventData<Entity>;
export type IndexCreateEvent<Entity> = EventData<Entity>;
export type IndexUpdateEvent<Entity> = EventData<Entity>;
export type IndexDeleteEvent<Entity> = EventData<Entity>;

export type QueueInitEvent = EventData<QueueInitEntity>;
export type ReviewFlashcardEvent = EventData<Flashcard> & {
	filepath: string;
	rating: Rating;
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
	due_today: number;
};

export type SessionStartEvent = EventData<SessionStartEntity>;
export type SessionEndEvent = EventData<SessionEndEntity>;
