export interface PerfCard {
	path: string;
	uuid: string;
	front: string;
	back: string;
	due: string;
}

export interface PerfFixture {
	count: number;
	dirPath: string;
	files: Map<string, string>;
	cards: PerfCard[];
	indexJson: string | null;
}

function envCount(): number {
	const parsed = Number.parseInt(process.env.PERF_N ?? '', 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 50000;
}

function cardUuid(index: number): string {
	return `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
}

export function buildFixture(opts: {
	count?: number;
	dirPath?: string;
	dueWindowMinutes?: number;
} = {}): PerfFixture {
	const count = opts.count ?? envCount();
	const dirPath = opts.dirPath ?? '/flashcards';
	const dueWindowMinutes = opts.dueWindowMinutes ?? 1;
	const files = new Map<string, string>();
	const cards: PerfCard[] = [];
	const now = Date.now();

	for (let index = 1; index <= count; index += 1) {
		const uuid = cardUuid(index);
		const front = `Q${index}`;
		const back = `A${index}`;
		const due = new Date(now - index * dueWindowMinutes * 60_000).toISOString();
		const path = `${dirPath.replace(/\/$/, '')}/card-${index.toString().padStart(6, '0')}.md`;
		const content = [
			'---',
			`uuid: ${JSON.stringify(uuid)}`,
			'source: null',
			'status: ACTIVE',
			`decks: ${JSON.stringify([`deck-${index % 20}`])}`,
			'card_type: basic',
			'stability: 0',
			'difficulty: 0',
			'scheduled_days: 0',
			'learning_steps: 0',
			'reps: 0',
			'lapses: 0',
			'state: 0',
			'last_review: null',
			`due: ${due}`,
			'---',
			front,
			'',
			'?',
			'',
			back,
		].join('\n');
		files.set(path, content);
		cards.push({ path, uuid, front, back, due });
	}

	return { count, dirPath, files, cards, indexJson: null };
}
