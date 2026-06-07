import { Event } from '../../core/Event';

export class FlashcardStatisticsComputeEvent extends Event<undefined> {
	static readonly type = 'Flashcard:Statistics:Compute';

	constructor() {
		super(FlashcardStatisticsComputeEvent.type, undefined);
	}
}
