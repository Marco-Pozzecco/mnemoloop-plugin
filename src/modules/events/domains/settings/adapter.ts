import { IEvent } from '@/interfaces/IEvent';
import { PluginSettings } from '@/schemas';
import { AdapterAction } from '@/types/adapters';
import { EventFactory } from '../../core/Event';

type Adapters = 'settings';
type AdapterEventType = `${Capitalize<Adapters>}:Adapter:${Capitalize<AdapterAction>}`;

const t: Record<AdapterAction, AdapterEventType> = {
	get: 'Settings:Adapter:Get',
	set: 'Settings:Adapter:Set',
	update: 'Settings:Adapter:Update',
	reset: 'Settings:Adapter:Reset',
	save: 'Settings:Adapter:Save',
	init: 'Settings:Adapter:Init',
	state: 'Settings:Adapter:State',
};

const SettingsAdapterGetRequestEvent = EventFactory.createRequest<void>(t.get);
type SettingsAdapterGetRequestEvent = IEvent<void>;

const SettingsAdapterGetResponseEvent = EventFactory.createResponse<PluginSettings>(t.get);
type SettingsAdapterGetResponseEvent = IEvent<PluginSettings>;

const SettingsAdapterSetRequestEvent = EventFactory.createRequest<{
	field: keyof PluginSettings;
	value: unknown;
}>(t.set);
type SettingsAdapterSetRequestEvent = IEvent<{ field: keyof PluginSettings; value: unknown }>;

const SettingsAdapterSetResponseEvent = EventFactory.createResponse<PluginSettings>(t.set);
type SettingsAdapterSetResponseEvent = IEvent<PluginSettings>;

const SettingsAdapterUpdateRequestEvent = EventFactory.createRequest<Partial<PluginSettings>>(
	t.update,
);
type SettingsAdapterUpdateRequestEvent = IEvent<Partial<PluginSettings>>;

const SettingsAdapterUpdateResponseEvent = EventFactory.createResponse<PluginSettings>(t.update);
type SettingsAdapterUpdateResponseEvent = IEvent<PluginSettings>;

const SettingsAdapterResetEvent = EventFactory.createEvent<void>(t.reset);
type SettingsAdapterResetEvent = IEvent<void>;

const SettingsAdapterSaveEvent = EventFactory.createEvent<void>(t.save);
type SettingsAdapterSaveEvent = IEvent<void>;

const SettingsAdapterInitEvent = EventFactory.createEvent<void>(t.init);
type SettingsAdapterInitEvent = IEvent<void>;

const SettingsAdapterStateEvent = EventFactory.createEvent<PluginSettings>(t.state);
type SettingsAdapterStateEvent = IEvent<PluginSettings>;

export {
	SettingsAdapterGetRequestEvent,
	SettingsAdapterGetResponseEvent,
	SettingsAdapterInitEvent,
	SettingsAdapterResetEvent,
	SettingsAdapterSaveEvent,
	SettingsAdapterSetRequestEvent,
	SettingsAdapterSetResponseEvent,
	SettingsAdapterStateEvent,
	SettingsAdapterUpdateRequestEvent,
	SettingsAdapterUpdateResponseEvent,
};
