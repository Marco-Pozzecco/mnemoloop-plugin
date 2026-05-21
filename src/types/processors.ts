import { FileWatcherProcessor } from '@/modules/events/processors/FileWatcherProcessor';
import { FlashcardParserProcessor } from '@/modules/events/processors/FlashcardParserProcessor';
import { FlashcardWriterProcessor } from '@/modules/events/processors/FlashcardWriterProcessor';
import { SettingsProcessor } from '@/modules/events/processors/SettingsProcessor';
import { StatisticsProcessor } from '@/modules/events/processors/StatisticsProcessor';

export enum ProcessorKey {
	fileWatcher = 'fileWatcher',
	flashcardParser = 'flashcardParser',
	flashcardWriter = 'flashcardWriter',
	settings = 'settings',
	statistics = 'statistics',
}

interface ProcessorMap {
	[ProcessorKey.fileWatcher]: FileWatcherProcessor;
	[ProcessorKey.flashcardParser]: FlashcardParserProcessor;
	[ProcessorKey.flashcardWriter]: FlashcardWriterProcessor;
	[ProcessorKey.settings]: SettingsProcessor;
	[ProcessorKey.statistics]: StatisticsProcessor;
}

export type Processors = Map<ProcessorKey, ProcessorMap[ProcessorKey]>;
export type ProcessorType<K extends ProcessorKey = ProcessorKey> = ProcessorMap[K];
