import { FlashcardMetadata } from '@/core/indexer';
import { YamlParseResult } from './types';

export interface IYamlEngine {
	extract(filePath: string): Promise<YamlParseResult>;

	generateYaml(metadata: FlashcardMetadata): Promise<String>;
}
