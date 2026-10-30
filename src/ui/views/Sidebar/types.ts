import type { App } from 'obsidian';

export interface SidebarProps {
	app: App;
	/** Status groups the user has collapsed, restored from the view's workspace state. */
	collapsedGroups?: string[];
	/** Persists the collapsed groups back to the view, which Obsidian serializes. */
	onCollapsedGroupsChange?: (groups: string[]) => void;
}
