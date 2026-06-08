import { PluginSettings } from '@/schemas';
import { AdapterAction } from '@/types/adapters';
import { Event, EventRequest, EventResponse } from '../../core/Event';

type Adapters = 'settings';
type AdapterEventType = `${Capitalize<Adapters>}:Adapter:${Capitalize<AdapterAction>}`;

const t: Record<AdapterAction, AdapterEventType> = {
	set: 'Settings:Adapter:Set',
	update: 'Settings:Adapter:Update',
	reset: 'Settings:Adapter:Reset',
	save: 'Settings:Adapter:Save',
	init: 'Settings:Adapter:Init',
	state: 'Settings:Adapter:State',
};

export class SettingsAdapterSetRequestEvent extends EventRequest<{
	field: keyof PluginSettings;
	value: unknown;
}> {
	constructor(data: { field: keyof PluginSettings; value: unknown }) {
		super(t.set, data);
	}
}

export class SettingsAdapterSetResponseEvent extends EventResponse<PluginSettings> {
	constructor(data: PluginSettings) {
		super(t.set, data);
	}
}

export class SettingsAdapterUpdateRequestEvent extends EventRequest<Partial<PluginSettings>> {
	constructor(data: Partial<PluginSettings>) {
		super(t.update, data);
	}
}

export class SettingsAdapterUpdateResponseEvent extends EventResponse<PluginSettings> {
	constructor(data: PluginSettings) {
		super(t.update, data);
	}
}

export class SettingsAdapterResetEvent extends Event<void> {
	constructor() {
		super(t.reset);
	}
}

export class SettingsAdapterSaveEvent extends Event<void> {
	constructor() {
		super(t.save);
	}
}

export class SettingsAdapterInitEvent extends Event<void> {
	constructor() {
		super(t.init, undefined);
	}
}

export class SettingsAdapterStateEvent extends Event<PluginSettings> {
	constructor(data: PluginSettings) {
		super(t.state, data);
	}
}
