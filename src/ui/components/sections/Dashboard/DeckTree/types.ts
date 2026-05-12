import type { DeckData, DeckNode } from '@/ui/store/deck-tree.store';

export default interface DeckTreeProps {
	nodes: DeckNode[];
	selectedDeck: DeckData | null;
	onSelectDeck: (fullPath: string | null) => void;
	onToggleExpand: (fullPath: string) => void;
	className?: string;
}
