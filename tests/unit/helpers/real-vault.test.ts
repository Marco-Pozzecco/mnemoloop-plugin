import { describe, expect, it, vi } from 'vitest';
import { buildRealStack } from '../../helpers/real-stack';

describe('real vault workspace', () => {
	it('holds a settable active file and dispatches active-leaf-change', async () => {
		const stack = await buildRealStack({
			files: new Map([['notes/biology.md', '# Biology']]),
		});
		const workspace = stack.plugin.app.workspace;
		const file = stack.vault.files.get('notes/biology.md');

		expect(workspace.getActiveFile()).toBeNull();

		workspace.setActiveFile(file);
		expect(workspace.getActiveFile()).toBe(file);

		const handler = vi.fn();
		workspace.on('active-leaf-change', handler);

		workspace.emitActiveLeafChange();
		expect(handler).toHaveBeenCalledTimes(1);

		stack.dispose();
	});

	it('removes an active-leaf-change handler when its ref is released', async () => {
		const stack = await buildRealStack({ files: new Map() });
		const workspace = stack.plugin.app.workspace;
		const handler = vi.fn();

		const ref = workspace.on('active-leaf-change', handler);
		workspace.offref(ref);
		workspace.emitActiveLeafChange();

		expect(handler).not.toHaveBeenCalled();
		stack.dispose();
	});
});
