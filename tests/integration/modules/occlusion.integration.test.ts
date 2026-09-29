import { describe, expect, it, beforeEach, vi } from 'vitest';
import { parseYaml } from 'obsidian';
import MnemoloopPlugin from '@/main';
import { FlashcardOcclusionContentParser } from '@/modules/parsers/content/FlashcardOcclusionContentParser';
import type { FlashcardParser } from '@/modules/parsers/entity/FlashcardParser';
import { CardType, FlashcardYaml } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import type { IAdapter } from '@/interfaces/IAdapter';
import { AdapterKey, Adapters } from '@/types/adapters';
import { ParserKey, Parsers } from '@/types/parsers';
import { createMockPlugin } from '../../helpers/mock-obsidian';
import { createFlashcardYaml } from '../../helpers/factories';

const CARD_PATH = 'cards/occlusion.md';

const FRONTMATTER: FlashcardYaml = createFlashcardYaml({
	card_type: CardType.Occlusion,
	uuid: '11111111-1111-4111-8111-111111111111',
});

const FRONTMATTER_TEXT = `uuid: ${FRONTMATTER.uuid}
status: ACTIVE
source: null
decks: []
card_type: occlusion`;

const BLOCK_MASKS = {
	masks: [
		{ id: 'm1', rect: [0.12, 0.3, 0.2, 0.1], answer: 'Left upper lobe', hint: null },
		{ id: 'm2', rect: [0.5, 0.5, 0.2, 0.2], answer: 'Right lower lobe', hint: 'lower' },
	],
};

function createSettings(): IAdapter<PluginSettings> {
	return {
		data: {
			flashcard: {
				marker: '?',
				watch: { directory: '/flashcards', tags: ['#flashcard'] },
			},
			debounce_timeout_ms: 500,
			enable_soft_delete: true,
			soft_delete_hours: 24,
		},
	} as IAdapter<PluginSettings>;
}

describe('Occlusion integration', () => {
	let mockPlugin: ReturnType<typeof createMockPlugin>;
	let parser: FlashcardParser;

	beforeEach(() => {
		vi.mocked(parseYaml).mockReset();
		// The Obsidian YAML codec is mocked at the module boundary, so the stub
		// answers per document: frontmatter on one call, the block on another.
		vi.mocked(parseYaml).mockImplementation((yaml: string) =>
			yaml.includes('masks:') ? BLOCK_MASKS : (FRONTMATTER as unknown as Record<string, unknown>),
		);
		mockPlugin = createMockPlugin([]);
	});

	/** Build the parser stack through the plugin's own registration in main.ts. */
	function createRegisteredParser(): FlashcardParser {
		const plugin = Object.create(MnemoloopPlugin.prototype) as MnemoloopPlugin;
		Object.assign(plugin, {
			app: mockPlugin.app,
			_adapter: new Map([[AdapterKey.settings, createSettings()]]) as Adapters,
			_parsers: new Map() as Parsers,
		});
		(plugin as unknown as { loadParsers: () => void }).loadParsers();
		return plugin['_parsers'].get(ParserKey.flashcard) as FlashcardParser;
	}

	it('parses an occlusion card file from disk end to end', async () => {
		parser = createRegisteredParser();
		mockPlugin.app.vault.fileMap.set(
			CARD_PATH,
			`---\n${FRONTMATTER_TEXT}\n---\n![[lungs.png]]\n\n\`\`\`occlusion\nmasks:\n  - id: m1\n\`\`\`\n`,
		);

		const result = await parser.parseFile(CARD_PATH);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.entity.card_type).toBe('occlusion');
			expect(result.entity.content).toEqual({
				meta_type: 'occlusion',
				image: 'lungs.png',
				masks: [
					{
						id: 'm1',
						rect: [0.12, 0.3, 0.2, 0.1],
						answer: 'Left upper lobe',
						hint: null,
					},
					{
						id: 'm2',
						rect: [0.5, 0.5, 0.2, 0.2],
						answer: 'Right lower lobe',
						hint: 'lower',
					},
				],
			});
		}
	});

	it('resolves the occlusion key in the content-parser map', () => {
		parser = createRegisteredParser();

		const contentParser = (
			parser as unknown as { _contentParsers: Map<CardType, unknown> }
		)._contentParsers.get(CardType.Occlusion);

		expect(contentParser).toBeInstanceOf(FlashcardOcclusionContentParser);
	});

	it('leaves the file byte-identical when the occlusion body fails to parse', async () => {
		parser = createRegisteredParser();
		const original = `---\n${FRONTMATTER_TEXT}\n---\n![[lungs.png]]\n\nno occlusion block\n`;
		mockPlugin.app.vault.fileMap.set(CARD_PATH, original);

		const result = await parser.parseFile(CARD_PATH);

		expect(result.success).toBe(false);
		expect(mockPlugin.app.fileManager.processFrontMatter).not.toHaveBeenCalled();
		expect(mockPlugin.app.vault.fileMap.get(CARD_PATH)).toBe(original);
	});
});
