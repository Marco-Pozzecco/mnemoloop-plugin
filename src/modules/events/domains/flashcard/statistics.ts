import { IEvent } from '@/interfaces/IEvent';
import { EventFactory } from '../../core/Event';

const FlashcardStatisticsComputeEvent = EventFactory.createEvent<void>('Flashcard:Statistics:Compute');
type FlashcardStatisticsComputeEvent = IEvent<void>;

export { FlashcardStatisticsComputeEvent };
