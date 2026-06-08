import { Plugin } from 'obsidian';
import { Adapters } from '@/types/adapters';
import { Indexes } from '@/types/indexes';
import { Parsers } from '@/types/parsers';
import { Writers } from '@/types/writers';

export interface ICommandDependencies {
	plugin: Plugin;
	adapters: Adapters;
	indexes: Indexes;
	parsers: Parsers;
	writers: Writers;
}

export interface ICommand {
	readonly id: string;
	readonly name: string;
	register(deps: ICommandDependencies): void;
	unregister?(): void;
}
