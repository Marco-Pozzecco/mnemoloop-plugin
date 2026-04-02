import { Indexes } from '@/types/indexes';
import { App, Component } from 'obsidian';

export interface AppProps {
	app: App;
	component: Component;
	indexes: Indexes;
}

export type AppViews = 'dashboard' | 'review';
