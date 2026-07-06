import { writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';
import {
	EventBus,
	FlashcardIndexGetAllRequestEvent,
	FlashcardIndexGetAllResponseEvent,
	FlashcardIndexStateEvent,
} from '@/modules/events';
import { CardStatus, FlashcardMetadata } from '@/schemas';
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
		if (card.status === CardStatus.DELETED) continue;

		const decks = !card.decks || card.decks.length === 0 ? ['Uncategorized'] : card.decks;

		for (const cardDeck of decks) {
			const allDecks = [...getParentDecks(cardDeck), cardDeck];
			for (const deck of allDecks) {
				const existing = counts.get(deck);
				if (existing) {
					existing.totalCards++;
					if (new Date(card.due) <= now) {
						existing.dueNow++;
					}
				} else {
					counts.set(deck, {
						totalCards: 1,
						dueNow: new Date(card.due) <= now ? 1 : 0,
					});
				}
			}
		}
	}

	// Step 2: Build tree structure from aggregated counts
	const roots: DeckNode[] = [];
	const nodeMap = new Map<string, DeckNode>();

	// Create all nodes
	for (const [fullPath, { dueNow, totalCards }] of counts) {
		const name = splitDeckPath(fullPath).pop() ?? fullPath;
		const node: DeckNode = {
			name,
			fullPath,
			dueNow,
			totalCards,
			children: [],
			isExpanded: false,
		};
		nodeMap.set(fullPath, node);
	}

	// Wire parent-child relationships
	for (const [fullPath, node] of nodeMap) {
		const parentPath = getParentDecks(fullPath).pop();
		if (parentPath) {
			const parent = nodeMap.get(parentPath);
			if (parent) {
				parent.children.push(node);
			}
		} else {
			roots.push(node);
			node.isExpanded = true;
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
	for (const node of nodes) {
		map.set(node.fullPath, node);
		for (const child of buildNodeMap(node.children).values()) {
			map.set(child.fullPath, child);
		}
	}
	return map;
}

export class DeckTreeStore extends BaseStoreManager<DeckTreeState> {
	private _unsubscribe: () => void;

	constructor() {
		super(DEFAULT_STATE, store);

		const responseHandler = async (
			event: FlashcardIndexStateEvent | FlashcardIndexGetAllResponseEvent,
		) => {
			let nodes: DeckNode[];

			if (event instanceof FlashcardIndexStateEvent) {
				nodes = buildDeckTree((event as FlashcardIndexStateEvent).data.flashcards);
			} else {
				nodes = buildDeckTree((event as FlashcardIndexGetAllResponseEvent).data);
			}

			const map = buildNodeMap(nodes);
			this.store.update((state) => ({ ...state, nodes, nodeMap: map }));
		};

		this._unsubscribe = EventBus.instance.subscribe(FlashcardIndexStateEvent, responseHandler);

		EventBus.instance.subscribeOnce(FlashcardIndexGetAllResponseEvent, responseHandler);
	}

	init() {
		void EventBus.instance.publish(new FlashcardIndexGetAllRequestEvent());
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

	dispose(): void {
		this._unsubscribe?.();
	}
}

export const deckTreeStore = new DeckTreeStore();
