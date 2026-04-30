import { Indexes } from '@/types/indexes';
import { Parsers } from '@/types/parsers';
import { App, Component } from 'obsidian';

export interface AppProps {
	app: App;
	component: Component;
	indexes: Indexes;
	parsers: Parsers;
}

export type AppViews = 'dashboard' | 'review';
