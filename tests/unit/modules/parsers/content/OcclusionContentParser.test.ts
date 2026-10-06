import { describe, expect, it, beforeEach, vi } from 'vitest';
import { parseYaml, stringifyYaml } from 'obsidian';
import type { FlashcardOcclusionContent } from '@/schemas';
import { CardType } from '@/schemas';
import { FlashcardOcclusionContentParser } from '@/modules/parsers/content/FlashcardOcclusionContentParser';

function body(block: string, embed: string = '![[lungs.png]]'): string {
	return `${embed}\n\n\`\`\`occlusion\n${block}\`\`\``;
}

const twoMasksBlock = `width: 1024
height: 768
masks:
  - id: m1
    rect:
      - 0.12
      - 0.3
      - 0.2
      - 0.1
    answer: Left upper lobe
    hint: null
  - id: m2
    rect:
      - 0.5
      - 0.5
      - 0.2
      - 0.2
    answer: Right lower lobe
    hint: lower division
`;

describe('OcclusionContentParser', () => {
	let parser: FlashcardOcclusionContentParser;

	beforeEach(() => {
		vi.mocked(parseYaml).mockReset();
		vi.mocked(stringifyYaml).mockReset();
		parser = new FlashcardOcclusionContentParser();
	});

	describe('parse', () => {
		it('should parse the image embed and the fenced occlusion block', () => {
			vi.mocked(parseYaml).mockReturnValue({
				width: 1024,
				height: 768,
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
						hint: 'lower division',
					},
				],
			});

			const result = parser.parse(body(twoMasksBlock));

			expect(result.success).toBe(true);
			expect(result.entity).toEqual({
				meta_type: 'occlusion',
				image: 'lungs.png',
				width: 1024,
				height: 768,
				masks: [
					{
						id: 'm1',
						rect: [0.12, 0.3, 0.2, 0.1],
						answer: 'Left upper lobe',
						hint: null,
						opaque: true,
					},
					{
						id: 'm2',
						rect: [0.5, 0.5, 0.2, 0.2],
						answer: 'Right lower lobe',
						hint: 'lower division',
						opaque: true,
					},
				],
			});
		});

		it('should assign positional ids and null hints where omitted', () => {
			vi.mocked(parseYaml).mockReturnValue({
				masks: [
					{ rect: [0, 0, 0.5, 0.5], answer: 'A' },
					{ rect: [0.5, 0.5, 0.5, 0.5], answer: 'B' },
				],
			});

			const result = parser.parse(body('masks: []'));

			expect(result.success).toBe(true);
			expect(result.entity).toEqual({
				meta_type: 'occlusion',
				image: 'lungs.png',
				masks: [
					{ id: 'm1', rect: [0, 0, 0.5, 0.5], answer: 'A', hint: null, opaque: true },
					{ id: 'm2', rect: [0.5, 0.5, 0.5, 0.5], answer: 'B', hint: null, opaque: true },
				],
			});
		});

		it('should preserve an explicit transparent mode', () => {
			vi.mocked(parseYaml).mockReturnValue({
				masks: [{ rect: [0, 0, 1, 1], answer: 'A', opaque: false }],
			});

			const result = parser.parse(body('masks: []'));

			expect(result.success).toBe(true);
			expect(result.entity!.masks[0].opaque).toBe(false);
		});

		it('should ignore a wiki embed display size', () => {
			vi.mocked(parseYaml).mockReturnValue({
				masks: [{ rect: [0, 0, 1, 1], answer: 'A' }],
			});

			const result = parser.parse(
				body('masks: []', '![[attachments/lungs.png|400]]'),
			);

			expect(result.success).toBe(true);
			expect(result.entity!.image).toBe('attachments/lungs.png');
		});

		it('should ignore a wiki embed display size and alias', () => {
			vi.mocked(parseYaml).mockReturnValue({
				masks: [{ rect: [0, 0, 1, 1], answer: 'A' }],
			});

			const result = parser.parse(
				body('masks: []', '![[attachments/lungs.png|400x300|diagram]]'),
			);

			expect(result.success).toBe(true);
			expect(result.entity!.image).toBe('attachments/lungs.png');
		});

		it('should accept the standard Markdown image form', () => {
			vi.mocked(parseYaml).mockReturnValue({
				masks: [{ rect: [0, 0, 1, 1], answer: 'A' }],
			});

			const result = parser.parse(
				body('masks: []', '![coronal section](attachments/lungs.png)'),
			);

			expect(result.success).toBe(true);
			expect(result.entity!.image).toBe('attachments/lungs.png');
		});

		it('should fail when the image reference is missing', () => {
			vi.mocked(parseYaml).mockReturnValue({
				masks: [{ rect: [0, 0, 1, 1], answer: 'A' }],
			});

			const result = parser.parse(body('masks: []', 'no image here'));

			expect(result.success).toBe(false);
			expect(result.entity).toBeNull();
		});

		it('should fail when the occlusion block is missing', () => {
			const result = parser.parse('![[lungs.png]]\n\nno block');

			expect(result.success).toBe(false);
			expect(result.entity).toBeNull();
		});

		it('should fail when the block YAML does not parse', () => {
			vi.mocked(parseYaml).mockImplementation(() => {
				throw new Error('bad yaml');
			});

			const result = parser.parse(body('masks: [unclosed'));

			expect(result.success).toBe(false);
			expect(result.entity).toBeNull();
		});

		it('should fail when the block has no masks key', () => {
			vi.mocked(parseYaml).mockReturnValue({ width: 1024 });

			const result = parser.parse(body('width: 1024'));

			expect(result.success).toBe(false);
			expect(result.entity).toBeNull();
		});

		it('should fail when the block declares an empty masks array', () => {
			vi.mocked(parseYaml).mockReturnValue({ masks: [] });

			const result = parser.parse(body('masks: []'));

			expect(result.success).toBe(false);
			expect(result.entity).toBeNull();
		});
	});

	describe('serialize', () => {
		// The Obsidian YAML codec is a mocked module boundary. JSON is a subset of
		// YAML 1.2 and keeps the same data shape, so it stands in for the codec on
		// both sides and the round trip below exercises our own logic faithfully.
		beforeEach(() => {
			vi.mocked(stringifyYaml).mockImplementation((obj: unknown) => JSON.stringify(obj));
			vi.mocked(parseYaml).mockImplementation((yaml: string) => JSON.parse(yaml) as unknown);
		});

		const content: FlashcardOcclusionContent = {
			meta_type: CardType.Occlusion,
			image: 'lungs.png',
			width: 1024,
			height: 768,
			masks: [
				{
					id: 'm1',
					rect: [0.12, 0.3, 0.2, 0.1],
					answer: 'Left upper lobe',
					hint: null,
					opaque: true,
				},
				{
					id: 'm2',
					rect: [0.5, 0.5, 0.2, 0.2],
					answer: 'Right lower lobe',
					hint: 'lower division',
					opaque: false,
				},
			],
		};

		it('should serialize the image embed followed by the fenced block', () => {
			const result = parser.serialize(content);

			expect(result.success).toBe(true);
			expect(result.entity).toBe(
				'![[lungs.png]]\n\n```occlusion\n' +
					JSON.stringify({
						width: 1024,
						height: 768,
						masks: [
							{
								id: 'm1',
								rect: [0.12, 0.3, 0.2, 0.1],
								answer: 'Left upper lobe',
								hint: null,
								opaque: true,
							},
							{
								id: 'm2',
								rect: [0.5, 0.5, 0.2, 0.2],
								answer: 'Right lower lobe',
								hint: 'lower division',
								opaque: false,
							},
						],
					}) +
					'```',
			);
		});

		it('should round-trip an explicit transparent mode', () => {
			const result = parser.serialize(content);

			expect(vi.mocked(stringifyYaml).mock.calls[0][0]).toEqual(
				expect.objectContaining({
					masks: [
						expect.objectContaining({ id: 'm1', opaque: true }),
						expect.objectContaining({ id: 'm2', opaque: false }),
					],
				}),
			);

			const reparsed = parser.parse(result.entity!);

			expect(reparsed.success).toBe(true);
			expect(reparsed.entity).toEqual(content);
		});

		it('should round rect values to four decimals', () => {
			const result = parser.serialize({
				...content,
				masks: [
					{
						id: 'm1',
						rect: [0.123456, 0.3000004, 0.999999, 0.0000001],
						answer: 'A',
						hint: null,
						opaque: true,
					},
				],
			});

			expect(result.success).toBe(true);
			expect(vi.mocked(stringifyYaml).mock.calls[0][0]).toEqual({
				width: 1024,
				height: 768,
				masks: [
					{
						id: 'm1',
						rect: [0.1235, 0.3, 1, 0],
						answer: 'A',
						hint: null,
						opaque: true,
					},
				],
			});
		});

		it('should round-trip content through serialize and parse', () => {
			const serialized = parser.serialize(content);

			const reparsed = parser.parse(serialized.entity!);

			expect(reparsed.success).toBe(true);
			expect(reparsed.entity).toEqual(content);
		});

		it('should leave absent dimensions absent through the round trip', () => {
			const {
				width: _width,
				height: _height,
				...withoutDimensions
			} = content;

			const serialized = parser.serialize(withoutDimensions);
			const reparsed = parser.parse(serialized.entity!);

			expect(vi.mocked(stringifyYaml).mock.calls[0][0]).not.toHaveProperty('width');
			expect(vi.mocked(stringifyYaml).mock.calls[0][0]).not.toHaveProperty('height');
			expect(reparsed.entity).toEqual(withoutDimensions);
		});
	});
});
