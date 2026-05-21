import { Workspace, WorkspaceLeaf } from 'obsidian';

export function isInSplitMode(leaves: WorkspaceLeaf[], targetLeaf: WorkspaceLeaf): boolean {
	return leaves.some((leaf) => leaf.parent !== targetLeaf.parent);
}

export function getRightmostLeaf(leaves: WorkspaceLeaf[]): WorkspaceLeaf {
	return leaves[leaves.length - 1];
}

export function openInSplitMode(workspace: Workspace): WorkspaceLeaf {
	const leaves: WorkspaceLeaf[] = [];

	workspace.iterateRootLeaves((leaf) => {
		leaves.push(leaf);
	});

	if (leaves.length === 0) return workspace.getLeaf(true);

	const splitLeaf = getRightmostLeaf(leaves);
	const isSplitMode = isInSplitMode(leaves, splitLeaf);
	const sourceLeaf = workspace.getMostRecentLeaf();

	let leaf: WorkspaceLeaf;

	// if already in split mode, create a new leaf in the same parent
	if (isSplitMode) {
		leaf = workspace.createLeafInParent(splitLeaf.parent, -1);
	} else {
		// otherwise, create a new leaf by splitting the source leaf
		if (sourceLeaf) {
			leaf = workspace.createLeafBySplit(sourceLeaf, 'vertical');
		} else {
			// or create a new leaf if no source leaf exists
			leaf = workspace.getLeaf(true);
		}
	}

	return leaf;
}
