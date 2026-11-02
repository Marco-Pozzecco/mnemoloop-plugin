import { describe, expect, it } from 'vitest';
import { prepareView } from '../../../playground/boot';
import { FIXTURES } from '../../../playground/fixtures';
import { buildRealStack } from '../../helpers/real-stack';

describe('sidebar playground path', () => {
	it('activates the fixture note so the panel has a note to bind to', async () => {
		const stack = await buildRealStack(FIXTURES.sidebar.documents);

		await prepareView(stack, {
			view: 'sidebar',
			fixture: 'sidebar',
			theme: 'light',
			platform: 'desktop',
		});

		expect(stack.plugin.app.workspace.getActiveFile()?.path).toBe('notes/biology.md');
		stack.dispose();
	});
});
