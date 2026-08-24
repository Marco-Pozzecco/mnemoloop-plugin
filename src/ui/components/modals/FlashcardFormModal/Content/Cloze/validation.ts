import { FlashcardClozeRegex } from '@/schemas';
import type { FlashcardClozeContent } from '@/schemas';
import { parseClozeContent } from '@/utils/cloze';

const NO_CLOZE_MARKER_ERROR = 'At least one {{c1::answer}} marker is required.';

export function validateCloze(clozeText: string): string | null {
	const regex = new RegExp(FlashcardClozeRegex.source, FlashcardClozeRegex.flags);
	return regex.test(clozeText) ? null : NO_CLOZE_MARKER_ERROR;
}

export function buildClozeContent(clozeText: string): FlashcardClozeContent {
	return parseClozeContent(clozeText);
}
