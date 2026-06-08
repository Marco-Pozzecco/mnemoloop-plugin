import { Event } from '../../core/Event';

enum EventAction {
	Compute = 'Compute',
}

type EventType = `Flashcard:Statistics:${EventAction}`;

const t: Record<Uncapitalize<EventAction>, EventType> = {
	compute: 'Flashcard:Statistics:Compute',
};

export class FlashcardStatisticsComputeEvent extends Event<void> {
	constructor() {
		super(t.compute);
	}
}
