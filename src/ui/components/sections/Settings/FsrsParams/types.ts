import type { PluginSettings } from '@/schemas/settings';

export default interface FsrsParamsProps {
	settings: PluginSettings;
	onNestedFieldChange: (path: string[], value: unknown) => void;
	hasError?: (key: string) => boolean;
	getError?: (key: string) => string | undefined;
}
