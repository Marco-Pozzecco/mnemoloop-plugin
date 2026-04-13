import { Plugin } from 'obsidian';
import { PluginSettings } from '@/schemas/settings';

// Section IDs for navigation
export type SectionId = 'flashcard' | 'performance' | 'danger';

// Section metadata
export interface SectionConfig {
	id: SectionId;
	title: string;
	description: string;
	icon?: string; // Obsidian icon name
}

// Props for the main Settings component
export interface SettingsViewProps {
	container: HTMLElement;
	plugin: Plugin;
}

// Navigation state
export interface NavigationState {
	activeSection: SectionId;
	sections: SectionConfig[];
}

// Section component common props
export interface SectionProps {
	settings: PluginSettings;
	onFieldChange: (key: string, value: unknown) => void;
	onNestedFieldChange: (path: string[], value: unknown) => void;
}
