import { IAdapter } from '@/interfaces/IAdapter';
import { ParseContentResult } from '@/interfaces/parser/utils';
import { CardType, FlashcardClozeContent } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { ContentParser } from '../_core/Content';

interface ClozeMatch {
	id: string;
	answer: string;
	hint: string | null;
	index: number;
	length: number;
}

export class FlashcardClozeContentParser extends ContentParser<FlashcardClozeContent> {
	readonly cardType = CardType.Cloze;
	private _settings: IAdapter<PluginSettings>;

	constructor(settings: IAdapter<PluginSettings>) {
		super();
		this._settings = settings;
	}

	parse = (body: string): ParseContentResult<FlashcardClozeContent> => {
		try {
			const matches = this._findClozeMatches(body);

			if (matches.length === 0) {
				throw new Error('No cloze deletions found');
			}

			// Sort by original index for position calculation
			matches.sort((a, b) => a.index - b.index);

			// Build clean text with deletions removed, tracking blank positions
			let cleanText = '';
			const rawDeletions: Array<{
				id: string;
				answer: string;
				hint: string | null;
				position: number;
			}> = [];
			let cursor = 0;

			for (const m of matches) {
				cleanText += body.slice(cursor, m.index);
				rawDeletions.push({
					id: m.id,
					answer: m.answer,
					hint: m.hint,
					position: cleanText.length,
				});
				cursor = m.index + m.length;
			}
			cleanText += body.slice(cursor);

			// Group deletions by id (supports repeated deletion groups like c1 appearing twice)
			const grouped = new Map<string, { answer: string; hint: string | null; positions: number[] }>();
			for (const d of rawDeletions) {
				const existing = grouped.get(d.id);
				if (existing) {
					existing.positions.push(d.position);
				} else {
					grouped.set(d.id, {
						answer: d.answer,
						hint: d.hint,
						positions: [d.position],
					});
				}
			}

			const deletions = [...grouped.entries()].map(([id, g]) => ({
				id,
				answer: g.answer,
				hint: g.hint,
				positions: g.positions,
			}));

			return this.parseContentResultSuccess({
				meta_type: this.cardType,
				text: cleanText,
				deletions,
			});
		} catch (error) {
			return this.parseContentResultError(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	};

	serialize = (content: FlashcardClozeContent): ParseContentResult<string> => {
		// Build a position → cloze lookup for O(1) insertion during iteration
		const positionMap = new Map<
			number,
			{ id: string; answer: string; hint: string | null }
		>();
		for (const del of content.deletions) {
			for (const pos of del.positions) {
				positionMap.set(pos, { id: del.id, answer: del.answer, hint: del.hint });
			}
		}

		// Iterate through text, inserting cloze patterns at marked positions
		let result = '';
		for (let i = 0; i < content.text.length; i++) {
			const cloze = positionMap.get(i);
			if (cloze) {
				result += this._formatCloze(cloze.id, cloze.answer, cloze.hint);
			}
			result += content.text[i];
		}

		// Handle a deletion positioned at the very end of the text
		const endCloze = positionMap.get(content.text.length);
		if (endCloze) {
			result += this._formatCloze(endCloze.id, endCloze.answer, endCloze.hint);
		}

		return this.parseContentResultSuccess(result);
	};

	private _findClozeMatches(body: string): ClozeMatch[] {
		const regex = /\{\{c(\d+)::(.*?)(?:::([^}]*))?\}\}/g;
		const matches: ClozeMatch[] = [];
		let m: RegExpExecArray | null;
		while ((m = regex.exec(body)) !== null) {
			matches.push({
				id: `c${m[1]}`,
				answer: m[2],
				hint: m[3] || null,
				index: m.index,
				length: m[0].length,
			});
		}
		return matches;
	}

	private _formatCloze(id: string, answer: string, hint: string | null): string {
		if (hint !== null) {
			return `{{${id}::${answer}::${hint}}}`;
		}
		return `{{${id}::${answer}}}`;
	}
}
