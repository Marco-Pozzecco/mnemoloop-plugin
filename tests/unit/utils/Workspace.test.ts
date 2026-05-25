import { describe, expect, it, vi } from 'vitest';
import { isInSplitMode, getRightmostLeaf, openInSplitMode } from '@/utils/Workspace';

describe('Workspace utils', () => {
	describe('isInSplitMode', () => {
		it('returns false when all leaves have the same parent', () => {
			const parent = { id: 'p1' };
			const leaves = [{ parent }, { parent }];
			expect(isInSplitMode(leaves as any, leaves[0] as any)).toBe(false);
		});

		it('returns true when at least one leaf has a different parent', () => {
			const p1 = { id: 'p1' };
			const p2 = { id: 'p2' };
			const leaves = [{ parent: p1 }, { parent: p2 }];
			expect(isInSplitMode(leaves as any, leaves[1] as any)).toBe(true);
		});
	});

	describe('getRightmostLeaf', () => {
		it('returns the last leaf in the array', () => {
			const leaves = [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }];
			expect(getRightmostLeaf(leaves as any)).toBe(leaves[2]);
		});
	});

	describe('openInSplitMode', () => {
		it('returns getLeaf(true) when no root leaves exist', () => {
			const newLeaf = { id: 'new' };
			const workspace = {
				iterateRootLeaves: vi.fn(() => {}),
				getLeaf: vi.fn().mockReturnValue(newLeaf),
			};
			const result = openInSplitMode(workspace as any);
			expect(workspace.getLeaf).toHaveBeenCalledWith(true);
			expect(result).toBe(newLeaf);
		});

		it('returns getLeaf(true) when single leaf and no source leaf exists', () => {
			const newLeaf = { id: 'new' };
			const workspace = {
				iterateRootLeaves: vi.fn((cb) => cb({ parent: { id: 'p1' } })),
				getMostRecentLeaf: vi.fn().mockReturnValue(null),
				getLeaf: vi.fn().mockReturnValue(newLeaf),
			};
			const result = openInSplitMode(workspace as any);
			expect(workspace.getMostRecentLeaf).toHaveBeenCalled();
			expect(workspace.getLeaf).toHaveBeenCalledWith(true);
			expect(result).toBe(newLeaf);
		});

		it('creates leaf by split when single leaf and source leaf exists', () => {
			const sourceLeaf = { id: 'source' };
			const newLeaf = { id: 'new' };
			const workspace = {
				iterateRootLeaves: vi.fn((cb) => cb({ parent: { id: 'p1' } })),
				getMostRecentLeaf: vi.fn().mockReturnValue(sourceLeaf),
				createLeafBySplit: vi.fn().mockReturnValue(newLeaf),
			};
			const result = openInSplitMode(workspace as any);
			expect(workspace.createLeafBySplit).toHaveBeenCalledWith(sourceLeaf, 'vertical');
			expect(result).toBe(newLeaf);
		});

		it('creates leaf in parent when already in split mode', () => {
			const rightParent = { id: 'right' };
			const rightLeaf = { parent: rightParent };
			const newLeaf = { id: 'new' };
			const workspace = {
				iterateRootLeaves: vi.fn((cb) => {
					cb({ parent: { id: 'left' } });
					cb(rightLeaf);
				}),
				getMostRecentLeaf: vi.fn().mockReturnValue(null),
				createLeafInParent: vi.fn().mockReturnValue(newLeaf),
			};
			const result = openInSplitMode(workspace as any);
			expect(workspace.createLeafInParent).toHaveBeenCalledWith(rightParent, -1);
			expect(result).toBe(newLeaf);
		});
	});
});
