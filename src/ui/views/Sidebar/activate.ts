import type { App, WorkspaceLeaf } from 'obsidian';
import { SIDEBAR_VIEW } from './constants';

/**
 * Reveals the flashcard sidebar, creating its right-sidebar leaf on first use.
 * Returns the revealed leaf, or `null` when the right sidebar is unavailable.
 */
export async function revealFlashcardSidebar(app: App): Promise<WorkspaceLeaf | null> {
	const { workspace } = app;
	let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(SIDEBAR_VIEW)[0] ?? null;

	if (!leaf) {
		leaf = workspace.getRightLeaf(false);
		if (!leaf) return null;
		await leaf.setViewState({ type: SIDEBAR_VIEW, active: true });
	}

	await workspace.revealLeaf(leaf);
	return leaf;
}
