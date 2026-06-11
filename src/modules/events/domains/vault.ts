import { IEvent } from '@/interfaces/IEvent';
import { EventFactory } from '../core/Event';

type VaultEventData = {
	path: string;
	entity: string;
};

const VaultCreateEvent = EventFactory.createEvent<VaultEventData>('Vault:Create');
type VaultCreateEvent = IEvent<VaultEventData>;

const VaultModifyEvent = EventFactory.createEvent<VaultEventData>('Vault:Modify');
type VaultModifyEvent = IEvent<VaultEventData>;

const VaultDeleteEvent = EventFactory.createEvent<VaultEventData>('Vault:Delete');
type VaultDeleteEvent = IEvent<VaultEventData>;

const VaultRenameEvent = EventFactory.createEvent<VaultEventData & { oldPath: string }>(
	'Vault:Rename',
);
type VaultRenameEvent = IEvent<VaultEventData & { oldPath: string }>;

export { VaultCreateEvent, VaultDeleteEvent, VaultModifyEvent, VaultRenameEvent };
