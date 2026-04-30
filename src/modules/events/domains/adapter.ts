import { FlashcardIndex, PluginSettings } from '@/schemas';
import { Stats } from '@/schemas/statistics';
import { Event } from '../core/Event';

export enum AdapterAction {
	Set = 'set',
	Update = 'update',
	Reset = 'reset',
	Save = 'save',
	Init = 'init',
}

type Adapters = 'settings' | 'flashcard' | 'statistics';
type AdapterEventType = `${Capitalize<Adapters>}:Adapter:${Capitalize<AdapterAction>}`;
type AdapterRequestEventType =
	`${Capitalize<Adapters>}:Adapter:Request:${Capitalize<AdapterAction>}`;

// Settings Adapter Request Events (dispatched by store, handled by adapter)
export class SettingsAdapterSetRequestEvent extends Event<{
	field: keyof PluginSettings;
	value: unknown;
}> {
	static readonly type: AdapterRequestEventType = 'Settings:Adapter:Request:Set';

	constructor(data: { field: keyof PluginSettings; value: unknown }) {
		super(SettingsAdapterSetRequestEvent.type, data);
	}
}

export class SettingsAdapterUpdateRequestEvent extends Event<Partial<PluginSettings>> {
	static readonly type: AdapterRequestEventType = 'Settings:Adapter:Request:Update';

	constructor(data: Partial<PluginSettings>) {
		super(SettingsAdapterUpdateRequestEvent.type, data);
	}
}

export class SettingsAdapterResetRequestEvent extends Event<void> {
	static readonly type: AdapterRequestEventType = 'Settings:Adapter:Request:Reset';

	constructor() {
		super(SettingsAdapterResetRequestEvent.type, undefined);
	}
}

export class SettingsAdapterSaveRequestEvent extends Event<void> {
	static readonly type: AdapterRequestEventType = 'Settings:Adapter:Request:Save';

	constructor() {
		super(SettingsAdapterSaveRequestEvent.type, undefined);
	}
}

// Settings Adapter Response Events (dispatched by adapter, handled by store)
export class SettingsAdapterSetResponseEvent extends Event<PluginSettings> {
	static readonly type: AdapterEventType = 'Settings:Adapter:Set';

	constructor(data: PluginSettings) {
		super(SettingsAdapterSetResponseEvent.type, data);
	}
}

export class SettingsAdapterUpdatedResponseEvent extends Event<PluginSettings> {
	static readonly type: AdapterEventType = 'Settings:Adapter:Update';

	constructor(data: PluginSettings) {
		super(SettingsAdapterUpdatedResponseEvent.type, data);
	}
}

export class SettingsAdapterResetResponseEvent extends Event<PluginSettings> {
	static readonly type: AdapterEventType = 'Settings:Adapter:Reset';

	constructor(data: PluginSettings) {
		super(SettingsAdapterResetResponseEvent.type, data);
	}
}

export class SettingsAdapterSaveResponseEvent extends Event<PluginSettings> {
	static readonly type: AdapterEventType = 'Settings:Adapter:Save';

	constructor(data: PluginSettings) {
		super(SettingsAdapterSaveResponseEvent.type, data);
	}
}

export class SettingsAdapterInitResponseEvent extends Event<PluginSettings> {
	static readonly type: AdapterEventType = 'Settings:Adapter:Init';

	constructor(data: PluginSettings) {
		super(SettingsAdapterInitResponseEvent.type, data);
	}
}

// Flashcard Adapter Events
export class FlashcardAdapterSetResponseEvent extends Event<FlashcardIndex> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Set';

	constructor(data: FlashcardIndex) {
		super(FlashcardAdapterSetResponseEvent.type, data);
	}
}

export class FlashcardAdapterUpdatedResponseEvent extends Event<FlashcardIndex> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Update';

	constructor(data: FlashcardIndex) {
		super(FlashcardAdapterUpdatedResponseEvent.type, data);
	}
}

export class FlashcardAdapterResetResponseEvent extends Event<FlashcardIndex> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Reset';

	constructor(data: FlashcardIndex) {
		super(FlashcardAdapterResetResponseEvent.type, data);
	}
}

export class FlashcardAdapterSaveResponseEvent extends Event<FlashcardIndex> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Save';

	constructor(data: FlashcardIndex) {
		super(FlashcardAdapterSaveResponseEvent.type, data);
	}
}

export class FlashcardAdapterInitResponseEvent extends Event<FlashcardIndex> {
	static readonly type: AdapterEventType = 'Flashcard:Adapter:Init';

	constructor(data: FlashcardIndex) {
		super(FlashcardAdapterInitResponseEvent.type, data);
	}
}

// Statistics Adapter Events
export class StatisticsAdapterSetResponseEvent extends Event<Stats> {
	static readonly type: AdapterEventType = 'Statistics:Adapter:Set';

	constructor(data: Stats) {
		super(StatisticsAdapterSetResponseEvent.type, data);
	}
}

export class StatisticsAdapterUpdatedResponseEvent extends Event<Stats> {
	static readonly type: AdapterEventType = 'Statistics:Adapter:Update';

	constructor(data: Stats) {
		super(StatisticsAdapterUpdatedResponseEvent.type, data);
	}
}

export class StatisticsAdapterResetResponseEvent extends Event<Stats> {
	static readonly type: AdapterEventType = 'Statistics:Adapter:Reset';

	constructor(data: Stats) {
		super(StatisticsAdapterResetResponseEvent.type, data);
	}
}

export class StatisticsAdapterSaveResponseEvent extends Event<Stats> {
	static readonly type: AdapterEventType = 'Statistics:Adapter:Save';

	constructor(data: Stats) {
		super(StatisticsAdapterSaveResponseEvent.type, data);
	}
}

export class StatisticsAdapterInitResponseEvent extends Event<Stats> {
	static readonly type: AdapterEventType = 'Statistics:Adapter:Init';

	constructor(data: Stats) {
		super(StatisticsAdapterInitResponseEvent.type, data);
	}
}
