import type { App } from 'obsidian';
import type KnowledgeAcceleratorPlugin from '@/main';
import type { SettingsManager } from '@/obsidian/SettingsManager';
import type { IPluginSettings } from '@/obsidian/contracts/ISettingsManager';

export interface SettingsTabProps {
	app: App;
	plugin: KnowledgeAcceleratorPlugin;
	settingsManager: SettingsManager;
	initialSettings: IPluginSettings;
}

export interface SettingsSectionProps {
	settings: IPluginSettings;
	onUpdate: (settings: Partial<IPluginSettings>) => void;
	onReset: () => void;
	validationErrors?: Record<string, string>;
}

export interface ValidationState {
	isValid: boolean;
	errors: Record<string, string>;
}

export type SettingValue =
	| string
	| number
	| boolean
	| string[]
	| Record<string, string>;

export interface SettingDefinition {
	key: keyof IPluginSettings;
	label: string;
	description?: string;
	type: 'text' | 'number' | 'boolean' | 'array' | 'tags' | 'dropdown';
	placeholder?: string;
	defaultValue?: SettingValue;
	min?: number;
	max?: number;
	options?: { value: string; label: string }[];
}

export const SETTINGS_SECTIONS = {
	FILE_WATCHING: 'File Watching',
	REVIEW: 'Review',
	ADVANCED: 'Advanced',
} as const;

export type SettingsSectionKey = keyof typeof SETTINGS_SECTIONS;
