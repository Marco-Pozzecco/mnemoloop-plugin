import { Event } from '../core';

export enum VaultAction {
	Create = 'create',
	Modify = 'modify',
	Delete = 'delete',
	Rename = 'rename',
}

type VaultEventName = `Vault:${Capitalize<VaultAction>}`;

type VaultEventData = {
	path: string;
	entity: string;
};

export class VaultCreateEvent extends Event<VaultEventData> {
	static readonly type: VaultEventName = 'Vault:Create';

	constructor(data: VaultEventData) {
		super(VaultCreateEvent.type, data);
	}
}

export type VaultCreateEventData = VaultCreateEvent['data'];

export class VaultModifyEvent extends Event<VaultEventData> {
	static readonly type: VaultEventName = 'Vault:Modify';

	constructor(data: VaultEventData) {
		super(VaultModifyEvent.type, data);
	}
}

export type VaultModifyEventData = VaultModifyEvent['data'];

export class VaultDeleteEvent extends Event<VaultEventData> {
	static readonly type: VaultEventName = 'Vault:Delete';

	constructor(data: VaultEventData) {
		super(VaultDeleteEvent.type, data);
	}
}

export type VaultDeleteEventData = VaultDeleteEvent['data'];

export class VaultRenameEvent extends Event<VaultEventData & { oldPath: string }> {
	static readonly type: VaultEventName = 'Vault:Rename';

	constructor(data: VaultEventData & { oldPath: string }) {
		super(VaultRenameEvent.type, data);
	}
}

export type VaultRenameEventData = VaultRenameEvent['data'];
