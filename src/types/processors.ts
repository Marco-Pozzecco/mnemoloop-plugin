import { FileWatcherProcessor } from '@/modules/events/processors/FileWatcherProcessor';
import { FlashcardWriterProcessor } from '@/modules/events/processors/FlashcardWriterProcessor';
import { StatisticsProcessor } from '@/modules/events/processors/StatisticsProcessor';

export enum ProcessorKey {
	fileWatcher = 'fileWatcher',
	flashcardWriter = 'flashcardWriter',
	statistics = 'statistics',
}

interface ProcessorMap {
	[ProcessorKey.fileWatcher]: FileWatcherProcessor;
	[ProcessorKey.flashcardWriter]: FlashcardWriterProcessor;
	[ProcessorKey.statistics]: StatisticsProcessor;
}

export type Processors = Map<ProcessorKey, ProcessorMap[ProcessorKey]>;
export type ProcessorType<K extends ProcessorKey = ProcessorKey> = ProcessorMap[K];
