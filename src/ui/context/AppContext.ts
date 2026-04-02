import { createContext } from 'svelte';
import type { App, Component } from 'obsidian';

export interface AppContextType {
	app: App;
	component: Component;
}

export const [getAppContext, setAppContext] = createContext<AppContextType>();
