import type { App, Component } from 'obsidian';

export default interface SidebarProps {
	app: App;
	/** The view component, for surfaces that render Obsidian content (Occlusion). */
	component: Component;
	/** Status groups the user has collapsed, restored from the view's workspace state. */
	collapsedGroups?: string[];
	/** Persists the collapsed groups back to the view, which Obsidian serializes. */
	onCollapsedGroupsChange?: (groups: string[]) => void;
}
