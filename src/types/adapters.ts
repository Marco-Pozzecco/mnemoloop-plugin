import { IAdapter } from '@/interfaces/IAdapter';
import { FlashcardIndex, PluginSettings, Stats } from '@/schemas';
import { EventData } from './events';

export enum AdapterKey {
	statistics = 'statistics',
	settings = 'settings',
	flashcard = 'flashcard',
}

interface AdapterMap {
	[AdapterKey.statistics]: IAdapter<Stats>;
	[AdapterKey.settings]: IAdapter<PluginSettings>;
	[AdapterKey.flashcard]: IAdapter<FlashcardIndex>;
}

export type Adapters = Map<AdapterKey, AdapterMap[AdapterKey]>;

type AdapterActions = 'set' | 'update' | 'reset' | 'save' | 'init';

type AdapterDataSchema = {
	settings: PluginSettings;
	flashcard_index: FlashcardIndex;
	stats: Stats;
};

export type AdapterDataKey = keyof AdapterDataSchema;

type AdapterEntityEvents<K extends keyof AdapterDataSchema> = {
	[A in AdapterActions]: A extends 'save'
		? EventData<{ [P in K]: AdapterDataSchema[K] } & { saved_at: Date }>
		: EventData<{ [P in K]: AdapterDataSchema[K] }>;
};

export type AdapterSettingsEvents = AdapterEntityEvents<'settings'>;
export type AdapterFlashcardEvents = AdapterEntityEvents<'flashcard_index'>;
export type AdapterStatsEvents = AdapterEntityEvents<'stats'>;

export type AdapterEventsKeys = Record<AdapterKey, Record<AdapterActions, AdapterEventEnumValue>>;

export const AdapterEventsKeys: AdapterEventsKeys = {
	flashcard: generateKeys('FLASHCARD'),
	settings: generateKeys('SETTINGS'),
	statistics: generateKeys('STATISTICS'),
};

export type AdapterEventsOf<K extends keyof AdapterEventsKeys> = AdapterEventsKeys[K];

type AdapterEventEnumKeys = `Adapter${Capitalize<AdapterKey>}${Capitalize<AdapterActions>}`;
type AdapterEventEnumValue = `ADAPTER:${Uppercase<AdapterKey>}:${Uppercase<AdapterActions>}`;
type AdapterEventEnum = Record<AdapterEventEnumKeys, AdapterEventEnumValue>;

export const AdapterEventType = flattenAdapterKeys(AdapterEventsKeys);
export type AdapterEventType = AdapterEventEnum[keyof typeof AdapterEventType];

// utils
function generateKeys(
	entity: Uppercase<AdapterKey>,
): Record<AdapterActions, AdapterEventEnumValue> {
	return {
		reset: `ADAPTER:${entity}:RESET`,
		save: `ADAPTER:${entity}:SAVE`,
		set: `ADAPTER:${entity}:SET`,
		update: `ADAPTER:${entity}:UPDATE`,
		init: `ADAPTER:${entity}:INIT`,
	};
}

function flattenAdapterKeys(obj: typeof AdapterEventsKeys): AdapterEventEnum {
	const result: Record<string, string> = {};
	for (const [entity, actions] of Object.entries(obj)) {
		for (const [action, key] of Object.entries(actions)) {
			// e.g. "AdpterFlashcardSet" -> "ADAPTER:FLASHCARD:SET"
			const enumKey = `Adapter${capitalize(entity)}${capitalize(action)}`;
			result[enumKey] = key;
		}
	}
	return result as AdapterEventEnum;
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
