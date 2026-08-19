import type { PluginSettings } from '@/schemas/settings';

export default interface SourceNoteConfigProps {
	settings: PluginSettings;
	onNestedFieldChange: (path: string[], value: unknown) => void;
	hasError?: (key: string) => boolean;
	getError?: (key: string) => string | undefined;
}
