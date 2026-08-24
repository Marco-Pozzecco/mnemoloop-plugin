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
