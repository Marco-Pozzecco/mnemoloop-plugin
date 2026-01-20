import { Index } from '../../indexer';
import { CardStatus } from '../../parser/utils/types';

export { CardStatus };

export enum SyncSource {
	JSON = 'json',
	YAML = 'yaml',
}

export interface SyncState {
	uuid: string;
	source: SyncSource;
	timestamp: string;
	changes: Record<string, any>;
	conflict: boolean;
}

export interface SyncResult {
	success: boolean;
	conflicts_resolved: number;
	errors: string[];
}

export interface SyncConflict {
	field: string;
	json_value: any;
	yaml_value: any;
	last_write: 'json' | 'yaml';
	resolved_value: any;
}

export interface IndexRecoveryResult {
	success: boolean;
	cards_recovered: number;
	cards_failed: number;
	errors: Array<{
		file: string;
		error: string;
	}>;
	duration_ms: number;
}

export const DEFAULT_INDEX: Index = {
	version: 0,
	last_updated: new Date().toISOString(),
	cards: {},
};
