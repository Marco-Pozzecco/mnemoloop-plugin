import { App, Component } from 'obsidian';

export interface AppProps {
	app: App;
	component: Component;
}

export type AppViews = 'dashboard' | 'review' | 'analytics';
