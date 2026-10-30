import { CardType, FlashcardClozeRegex } from '@/schemas';
import type { FlashcardClozeContent } from '@/schemas';

export function parseClozeContent(body: string): FlashcardClozeContent {
	const regex = new RegExp(FlashcardClozeRegex.source, FlashcardClozeRegex.flags);
	const grouped = new Map<
		string,
		{ answer: string; hint: string | null; positions: number[] }
	>();
	let text = '';
	let cursor = 0;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(body)) !== null) {
		text += body.slice(cursor, match.index);
		const id = `c${match[1]}`;
		const existing = grouped.get(id);
		const position = text.length;

		if (existing) {
			existing.positions.push(position);
		} else {
			grouped.set(id, {
				answer: match[2],
				hint: match[3] || null,
				positions: [position],
			});
		}

		cursor = match.index + match[0].length;
	}

	if (grouped.size === 0) {
		throw new Error('No cloze deletions found');
	}

	text += body.slice(cursor);

	return {
		meta_type: CardType.Cloze,
		text,
		deletions: [...grouped.entries()].map(([id, deletion]) => ({
			id,
			answer: deletion.answer,
			hint: deletion.hint,
			positions: deletion.positions,
		})),
	};
}

/**
 * Plain-text rendering of a cloze card, e.g. for a card preview.
 *
 * `text` is stored with the answers cut out, so each recorded position gets a
 * placeholder back. Positions are walked in order and clamped to the text, so a
 * deletion repeated at several positions adds one placeholder each and a
 * deletion at the very end of the text still renders.
 */
export function renderClozeText(
	content: Pick<FlashcardClozeContent, 'text' | 'deletions'>,
	placeholder = '[...]',
): string {
	const positions = content.deletions
		.flatMap((deletion) => deletion.positions)
		.sort((a, b) => a - b);

	let cursor = 0;
	let result = '';

	for (const raw of positions) {
		const position = Math.max(cursor, Math.min(raw, content.text.length));
		result += content.text.slice(cursor, position) + placeholder;
		cursor = position;
	}

	return result + content.text.slice(cursor);
}
