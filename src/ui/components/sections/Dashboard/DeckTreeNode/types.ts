import type { DeckData, DeckNode } from '@/ui/store/deck-tree.store';

export default interface DeckTreeNodeProps {
	node: DeckNode;
	selectedDeck: DeckData | null;
	onSelectDeck: (fullPath: string | null) => void;
	onToggleExpand: (fullPath: string) => void;
	level: number;
}
