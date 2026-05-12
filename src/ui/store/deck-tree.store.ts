import { writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';
import { EventBus, FlashcardIndexRecalcResponseEvent } from '@/modules/events';
import { FlashcardMetadata } from '@/schemas';
import { getParentDecks, splitDeckPath } from '@/utils/deck-utils';

export interface DeckNode {
	name: string;
	fullPath: string;
	dueNow: number;
	totalCards: number;
	children: DeckNode[];
	isExpanded: boolean;
}

export interface DeckData {
	name: string;
	fullPath: string;
	dueNow: number;
	totalCards: number;
}

export interface DeckTreeState {
	nodes: DeckNode[];
	nodeMap: Map<string, DeckNode>;
	selectedDeck: DeckData | null;
}

const DEFAULT_STATE: DeckTreeState = {
	nodes: [],
	nodeMap: new Map<string, DeckNode>(),
	selectedDeck: null,
};

const store = writable(DEFAULT_STATE);

export function buildDeckTree(flashcards: FlashcardMetadata[]): DeckNode[] {
	const now = new Date();
	const counts = new Map<string, { dueNow: number; totalCards: number }>();

	// Step 1: Aggregate counts for every deck path
	for (const card of flashcards) {
		if (card.status !== 'ACTIVE') continue;
		const isDue = new Date(card.due) <= now;

		// VIRTUAL NORMALIZATION: empty/missing decks → 'Uncategorized'
		const effectiveDecks = card.decks?.length ? card.decks : ['Uncategorized'];

		for (const deck of effectiveDecks) {
			const existing = counts.get(deck) ?? { dueNow: 0, totalCards: 0 };
			existing.totalCards++;
			if (isDue) existing.dueNow++;
			counts.set(deck, existing);

			// Increment all parent decks (prefix match semantics)
			for (const parent of getParentDecks(deck)) {
				const p = counts.get(parent) ?? { dueNow: 0, totalCards: 0 };
				p.totalCards++;
				if (isDue) p.dueNow++;
				counts.set(parent, p);
			}
		}
	}

	// Step 2: Build tree structure from aggregated counts
	const roots: DeckNode[] = [];
	const nodeMap = new Map<string, DeckNode>();

	// Create all nodes
	for (const [fullPath, { dueNow, totalCards }] of counts) {
		const parts = splitDeckPath(fullPath);
		const name = parts[parts.length - 1];
		const node: DeckNode = {
			name,
			fullPath,
			dueNow,
			totalCards,
			children: [],
			isExpanded: parts.length === 1, // expand top-level by default
		};
		nodeMap.set(fullPath, node);
	}

	// Wire parent-child relationships
	for (const [fullPath, node] of nodeMap) {
		const parentPath = getParentDecks(fullPath).pop();
		if (parentPath && nodeMap.has(parentPath)) {
			nodeMap.get(parentPath)!.children.push(node);
		} else {
			roots.push(node);
		}
	}

	// Sort children alphabetically by name
	for (const node of nodeMap.values()) {
		node.children.sort((a, b) => a.name.localeCompare(b.name));
	}
	roots.sort((a, b) => a.name.localeCompare(b.name));

	return roots;
}

function toggleNodeExpand(nodes: DeckNode[], fullPath: string): DeckNode[] {
	return nodes.map((node) => {
		if (node.fullPath === fullPath) {
			return { ...node, isExpanded: !node.isExpanded };
		}
		if (node.children.length > 0) {
			return { ...node, children: toggleNodeExpand(node.children, fullPath) };
		}
		return node;
	});
}

function buildNodeMap(nodes: DeckNode[]): Map<string, DeckNode> {
	const map = new Map<string, DeckNode>();
	function walk(ns: DeckNode[]) {
		for (const n of ns) {
			map.set(n.fullPath, n);
			walk(n.children);
		}
	}
	walk(nodes);
	return map;
}

export class DeckTreeStore extends BaseStoreManager<DeckTreeState> {
	constructor() {
		super(DEFAULT_STATE, store);

		EventBus.instance.subscribe((event) => {
			if (event.isType(FlashcardIndexRecalcResponseEvent.type)) {
				const data = (event as FlashcardIndexRecalcResponseEvent).data;
				const nodes = buildDeckTree(data.flashcards);
				const map = buildNodeMap(nodes);
				this.store.update((state) => ({ ...state, nodes, nodeMap: map }));
			}
		});
	}

	selectDeck(fullPath: string | null): void {
		const node = this.state.nodeMap.get(fullPath ?? '');
		const deckData = node
			? {
					name: node.name,
					fullPath: node.fullPath,
					dueNow: node.dueNow,
					totalCards: node.totalCards,
				}
			: null;
		this.store.update((state) => ({ ...state, selectedDeck: deckData }));
	}

	toggleExpand(fullPath: string): void {
		this.store.update((state) => {
			const nodes = toggleNodeExpand(state.nodes, fullPath);
			return { ...state, nodes };
		});
	}
}

export const deckTreeStore = new DeckTreeStore();
