import { IAdapter } from '@/interfaces/IAdapter';
import { FlashcardIndex, PluginSettings, Stats } from '@/schemas';

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

export enum AdapterAction {
	Get = 'get',
	Set = 'set',
	Update = 'update',
	Reset = 'reset',
	Save = 'save',
	Init = 'init',
	State = 'state',
}
