import { Plugin } from 'obsidian';
import { PluginSettings } from './core/types';

const DEFAULT_SETTINGS: PluginSettings = {
	flashcardsDirectory: 'Flashcards/',
	reviewIntervals: [1, 3, 7, 14, 30],
	baseEase: 2.5,
};

export default class KnowledgeAcceleratorPlugin extends Plugin {
	settings!: PluginSettings;

	async onload() {
		await this.loadSettings();
		console.log('Loading Obsidian Knowledge Accelerator');
	}

	onunload() {
		console.log('Unloading Obsidian Knowledge Accelerator');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
