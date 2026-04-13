import type { PluginSettings } from '@/schemas/settings';

export default interface DataManagementProps {
	settings: PluginSettings;
	onFieldChange: (key: string, value: unknown) => void;
	hasError?: (key: string) => boolean;
	getError?: (key: string) => string | undefined;
}
