import { getPath } from '@/utils/dot-path';
import { RETENTION_PERIOD_OPTIONS } from '@/schemas/settings';
import { settingsStore } from '@/ui/store/settings.store';
import { Notice, Plugin, PluginSettingTab, Setting, type SettingDefinitionItem } from 'obsidian';
import { mount, unmount } from 'svelte';
import FsrsIntervalPreview from './FsrsIntervalPreview/component.svelte';
import {
	coerceControlValue,
	formatSteps,
	formatTags,
	parseSteps,
	parseTags,
	readControlValue,
	type ParseResult,
} from './utils';

function retentionOptions(): Record<string, string> {
	return Object.fromEntries(
		RETENTION_PERIOD_OPTIONS.map((option) => [String(option.value), option.label]),
	);
}

export class SettingsView extends PluginSettingTab {
	constructor(plugin: Plugin) {
		super(plugin.app, plugin);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Flashcard directory',
				desc: 'Vault folder Mnemoloop watches for flashcards.',
				control: {
					type: 'folder',
					key: 'flashcard.watch.directory',
					includeRoot: false,
					placeholder: 'flashcards',
				},
			},
			{
				name: 'Flashcard marker',
				desc: 'Marker that splits a card into front and back.',
				control: {
					type: 'text',
					key: 'flashcard.marker',
					validate: (value) => (value.trim() === '' ? 'Enter a marker.' : undefined),
				},
			},
			{
				type: 'group',
				heading: 'Source notes',
				items: [
					{
						name: 'Source note directory',
						desc: 'Folder whose notes are offered as review context; empty disables directory matching.',
						control: {
							type: 'folder',
							key: 'source_note.watch.directory',
							includeRoot: false,
							placeholder: 'notes',
						},
					},
					{
						name: 'Source note tags',
						desc: 'Comma-separated #tags that mark source notes; empty disables tag matching.',
						render: (setting) =>
							this.renderCommaList(setting, 'source_note.watch.tags', parseTags, formatTags),
					},
					{
						name: 'Difficulty threshold',
						desc: 'Include a source note when a due card is harder than this value.',
						control: {
							type: 'number',
							key: 'source_note.priming.difficulty_threshold',
							min: 0,
							step: 0.1,
							defaultValue: 7.0,
							validate: (value) =>
								Number.isFinite(value) && value >= 0
									? undefined
									: 'Enter a non-negative number.',
						},
					},
				],
			},
			{
				type: 'group',
				heading: 'FSRS parameters',
				items: [
					{
						name: 'Retention rate',
						desc: 'Target probability of recall.',
						control: {
							type: 'slider',
							key: 'flashcard.fsrs.request_retention',
							min: 0.8,
							max: 1,
							step: 0.01,
							displayFormat: (value) => value.toFixed(2),
						},
					},
					{
						name: 'Maximum interval',
						desc: 'Maximum number of days between reviews.',
						control: {
							type: 'number',
							key: 'flashcard.fsrs.maximum_interval',
							min: 1,
							defaultValue: 36500,
						},
					},
					{
						name: 'Enable fuzz',
						desc: 'Add small random variations to intervals.',
						control: { type: 'toggle', key: 'flashcard.fsrs.enable_fuzz' },
					},
					{
						name: 'Enable short term',
						desc: 'Allow learning and relearning steps in minutes and hours.',
						control: { type: 'toggle', key: 'flashcard.fsrs.enable_short_term' },
					},
					{
						name: 'Learning steps',
						desc: 'Comma-separated steps, for example 1m, 10m.',
						render: (setting) =>
							this.renderCommaList(
								setting,
								'flashcard.fsrs.learning_steps',
								parseSteps,
								formatSteps,
							),
					},
					{
						name: 'Relearning steps',
						desc: 'Comma-separated steps, for example 10m.',
						render: (setting) =>
							this.renderCommaList(
								setting,
								'flashcard.fsrs.relearning_steps',
								parseSteps,
								formatSteps,
							),
					},
					{
						name: 'Interval preview',
						desc: 'Intervals the current parameters would schedule.',
						render: (setting) => this.renderIntervalPreview(setting),
					},
				],
			},
			{
				type: 'group',
				heading: 'Data management',
				items: [
					{
						name: 'Enable soft delete',
						desc: 'Keep deleted items recoverable for a period.',
						control: { type: 'toggle', key: 'enable_soft_delete' },
					},
					{
						name: 'Retention period',
						desc: 'How long deleted items are kept before permanent removal.',
						control: {
							type: 'dropdown',
							key: 'soft_delete_hours',
							options: retentionOptions(),
							disabled: () => !settingsStore.currentSettings.enable_soft_delete,
						},
					},
				],
			},
		];
	}

	getControlValue(key: string): unknown {
		return readControlValue(key, getPath(settingsStore.currentSettings, key));
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		try {
			await settingsStore.commitPath(key, coerceControlValue(key, value));
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Failed to save settings: ${message}`);
		}
	}

	/**
	 * Renders a comma-separated list control (learning steps, source-note tags).
	 * Commits only when the parsed value is valid and shows an inline error
	 * otherwise. `validate` callbacks cannot be used because the bound value is
	 * an array, not a string.
	 */
	private renderCommaList(
		setting: Setting,
		key: string,
		parse: (raw: string) => ParseResult<string[]>,
		format: (value: unknown) => string,
	): () => void {
		const wrapper = setting.controlEl.createDiv({ cls: 'ml-settings-control' });
		const input = wrapper.createEl('input', { type: 'text' });
		input.addClass('ml-settings-control-input');
		input.value = format(getPath(settingsStore.currentSettings, key));

		const errorEl = wrapper.createDiv({ cls: 'ml-settings-control-error' });
		errorEl.hide();

		const commit = async (): Promise<void> => {
			const result = parse(input.value);
			if (!result.ok) {
				errorEl.setText(result.error);
				errorEl.show();
				return;
			}
			errorEl.hide();
			try {
				await settingsStore.commitPath(key, result.value);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				new Notice(`Failed to save settings: ${message}`);
			}
		};

		input.addEventListener('change', () => void commit());

		return () => {
			wrapper.remove();
		};
	}

	/**
	 * Mounts the live interval preview. The component owns its store
	 * subscription, so a single mount keeps updating as FSRS parameters change;
	 * cleanup unmounts it (tearing the subscription down with it).
	 */
	private renderIntervalPreview(setting: Setting): () => void {
		setting.settingEl.addClass('ml-settings-preview-row');
		const host = setting.settingEl.createDiv({ cls: 'ml-settings-preview-host' });
		const component = mount(FsrsIntervalPreview, { target: host });
		return () => {
			void unmount(component);
			host.remove();
		};
	}
}
