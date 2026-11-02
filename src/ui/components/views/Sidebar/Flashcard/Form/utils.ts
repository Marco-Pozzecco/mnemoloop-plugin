import type { EventClass } from '@/interfaces/IEventRegistry';
import type { IEvent } from '@/interfaces/IEvent';
import { EventBus } from '@/modules/events/core';
import {
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
	FlashcardWriterUpdateRequestEvent,
	FlashcardWriterUpdateResponseEvent,
} from '@/modules/events/domains/flashcard/writer';
import type { CardStatus, Flashcard, FlashcardContent } from '@/schemas';

export interface FlashcardWriteResult {
	success: boolean;
	filepath?: string;
}

export interface FlashcardWrite {
	promise: Promise<FlashcardWriteResult>;
	cancel: () => void;
}

interface WriteResponseData {
	filepath: string;
	requestId: string;
	success: boolean;
}

/**
 * Publish a writer request and resolve on the response that carries its id.
 * A second form can be open elsewhere, so the response is correlated by request
 * id rather than by the event type alone.
 */
function correlate(
	request: IEvent<unknown>,
	responseClass: EventClass<WriteResponseData>,
): FlashcardWrite {
	let unsubscribe: (() => void) | null = null;
	let settled = false;
	let resolveResult!: (result: FlashcardWriteResult) => void;

	const promise = new Promise<FlashcardWriteResult>((resolve) => {
		resolveResult = resolve;
	});

	const finish = (result: FlashcardWriteResult): void => {
		if (settled) return;
		settled = true;
		unsubscribe?.();
		unsubscribe = null;
		resolveResult(result);
	};

	unsubscribe = EventBus.instance.subscribe(responseClass, async (response) => {
		if (response.data.requestId !== request.id) return;
		finish({ success: response.data.success, filepath: response.data.filepath });
	});

	void EventBus.instance.publish(request).catch(() => finish({ success: false }));

	return {
		promise,
		cancel: () => finish({ success: false }),
	};
}

/** Create a flashcard. The handler owns the write; this only carries the response. */
export function createFlashcard(
	content: FlashcardContent,
	decks: string[],
	source: string | null,
): FlashcardWrite {
	const request = new FlashcardWriterCreateRequestEvent({ content, decks, source });
	return correlate(request, FlashcardWriterCreateResponseEvent);
}

/** Update a flashcard. Status is sent only from the edit form. */
export function updateFlashcard(
	uuid: string,
	content: FlashcardContent,
	decks: string[],
	source: string | null,
	status: CardStatus,
): FlashcardWrite {
	const request = new FlashcardWriterUpdateRequestEvent({
		uuid,
		content,
		decks,
		source,
		status,
	} as Partial<Flashcard>);
	return correlate(request, FlashcardWriterUpdateResponseEvent);
}
