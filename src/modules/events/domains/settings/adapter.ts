import { PluginSettings } from '@/schemas';
import { AdapterAction } from '@/types/adapters';
import { Event } from '../../core/Event';

type Adapters = 'settings';
type AdapterEventType = `${Capitalize<Adapters>}:Adapter:${Capitalize<AdapterAction>}`;

export class SettingsAdapterSetEvent extends Event<{
	field: keyof PluginSettings;
	value: unknown;
}> {
	static readonly type: AdapterEventType = 'Settings:Adapter:Set';

	constructor(data: { field: keyof PluginSettings; value: unknown }) {
		super(SettingsAdapterSetEvent.type, data);
	}
}

export class SettingsAdapterUpdateEvent extends Event<Partial<PluginSettings>> {
	static readonly type: AdapterEventType = 'Settings:Adapter:Update';

	constructor(data: Partial<PluginSettings>) {
		super(SettingsAdapterUpdateEvent.type, data);
	}
}

export class SettingsAdapterResetEvent extends Event<void> {
	static readonly type: AdapterEventType = 'Settings:Adapter:Reset';

	constructor() {
		super(SettingsAdapterResetEvent.type, undefined);
	}
}

export class SettingsAdapterSaveEvent extends Event<void> {
	static readonly type: AdapterEventType = 'Settings:Adapter:Save';

	constructor() {
		super(SettingsAdapterSaveEvent.type, undefined);
	}
}

export class SettingsAdapterInitEvent extends Event<void> {
	static readonly type: AdapterEventType = 'Settings:Adapter:Init';

	constructor() {
		super(SettingsAdapterInitEvent.type, undefined);
	}
}
