import { getLinkpath, parseYaml, stringifyYaml } from 'obsidian';
import { ParseContentResult } from '@/interfaces/parser/utils';
import { CardType, FlashcardOcclusionContent, FlashcardOcclusionContentSchema } from '@/schemas';
import { ContentParser } from '../_core/Content';

const WIKI_EMBED_REGEX = /!\[\[([^\]]+)\]\]/;
const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*\]\(([^)]+)\)/;
const OCCLUSION_BLOCK_REGEX = /```occlusion[ \t]*\r?\n([\s\S]*?)```/;

export class FlashcardOcclusionContentParser extends ContentParser<FlashcardOcclusionContent> {
	readonly cardType = CardType.Occlusion;

	parse = (body: string): ParseContentResult<FlashcardOcclusionContent> => {
		try {
			const image = this._extractImage(body);
			const block = this._extractBlock(body);
			const parsed = parseYaml(block) as Record<string, unknown> | null;

			const masks = ((parsed?.masks ?? []) as Array<Record<string, unknown>>).map(
				(mask, index) => ({
					id: mask.id ?? `m${index + 1}`,
					rect: mask.rect,
					answer: mask.answer,
					hint: mask.hint ?? null,
				}),
			);

			const content: Record<string, unknown> = {
				meta_type: this.cardType,
				image,
				masks,
			};
			if (parsed?.width !== undefined) content.width = parsed.width;
			if (parsed?.height !== undefined) content.height = parsed.height;

			return this.parseContentResultSuccess(FlashcardOcclusionContentSchema.parse(content));
		} catch (error) {
			return this.parseContentResultError(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	};

	serialize = (content: FlashcardOcclusionContent): ParseContentResult<string> => {
		try {
			const block: Record<string, unknown> = {};
			if (content.width !== undefined) block.width = content.width;
			if (content.height !== undefined) block.height = content.height;
			block.masks = content.masks.map((mask) => ({
				id: mask.id,
				rect: mask.rect.map((value) => Math.round(value * 10000) / 10000),
				answer: mask.answer,
				hint: mask.hint,
			}));

			const body = `![[${content.image}]]\n\n\`\`\`occlusion\n${stringifyYaml(block)}\`\`\``;

			return this.parseContentResultSuccess(body);
		} catch (error) {
			return this.parseContentResultError(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	};

	private _extractImage(body: string): string {
		const wiki = body.match(WIKI_EMBED_REGEX);
		if (wiki) return getLinkpath(wiki[1]);

		const markdown = body.match(MARKDOWN_IMAGE_REGEX);
		if (markdown) return markdown[1].trim().split(/\s+/)[0];

		throw new Error('Occlusion card is missing an image reference');
	}

	private _extractBlock(body: string): string {
		const match = body.match(OCCLUSION_BLOCK_REGEX);
		if (!match) throw new Error('Occlusion card is missing its occlusion block');
		return match[1];
	}
}
