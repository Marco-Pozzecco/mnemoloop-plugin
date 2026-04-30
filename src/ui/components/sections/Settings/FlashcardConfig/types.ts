import type { PluginSettings } from '@/schemas/settings';

export default interface FlashcardConfigProps {
	settings: PluginSettings;
	onFieldChange: (key: string, value: unknown) => void;
	onNestedFieldChange: (path: string[], value: unknown) => void;
	hasError?: (key: string) => boolean;
	getError?: (key: string) => string | undefined;
}
