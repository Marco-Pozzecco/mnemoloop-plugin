import {
	FlashcardAdapterInitEvent,
	FlashcardIndexInitEvent,
	SettingsAdapterInitEvent,
	StatisticsAdapterInitEvent,
} from '@/modules/events';
import { IndexKey } from '@/types/indexes';
import { DashboardController } from '@/ui/controllers/DashboardController';
import { PrimingController } from '@/ui/controllers/PrimingController';
import { bannerStore } from '@/ui/store/banner.store';
import { modalStore, ModalViewEnum } from '@/ui/store/modal.store';
import { uiStore } from '@/ui/store/ui.store';
import { SvelteModal } from '@/ui/views/Modal/ModalView';
import { ModalClassNames } from '@/ui/views/Modal/types';
import { buildRealStack, type RealStack } from '../tests/helpers/real-stack';
import type { PlaygroundFixture } from './fixtures';
import type { PlaygroundParams } from './routes';

/**
 * Boots the production object graph the way `main.ts` does, without the Obsidian
 * plugin lifecycle: adapters, parsers, indexer, writer and event registry first,
 * then the initialization events in the production order, with
 * `FlashcardIndexInitEvent` last, and finally the banner store.
 */
export async function bootPlayground(fixture: PlaygroundFixture): Promise<RealStack> {
	// Do not reset the event singletons: the UI stores subscribe at module load,
	// before boot runs, and must receive the adapter state events.
	const stack = await buildRealStack(fixture.documents, { resetEventSingletons: false });
	useSvgAssetUrls(stack);

	await stack.bus.publish(new FlashcardAdapterInitEvent());
	await stack.bus.publish(new SettingsAdapterInitEvent());
	await stack.bus.publish(new StatisticsAdapterInitEvent());
	await stack.bus.publish(new FlashcardIndexInitEvent());

	bannerStore.init();
	return stack;
}

/**
 * Fixture images are served from the in-memory vault as data URLs so occlusion
 * cards render without a real vault adapter.
 */
function useSvgAssetUrls(stack: RealStack): void {
	stack.plugin.app.vault.getResourcePath = (file: { path: string; extension?: string }) => {
		const content = stack.vault.contents.get(file.path);
		if (file.extension === 'svg' && content) {
			return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`;
		}
		return placeholderImage(file.path);
	};
}

function placeholderImage(path: string): string {
	const label = path.slice(path.lastIndexOf('/') + 1);
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#dcdce0"/><text x="160" y="92" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#5c5f66">${label}</text></svg>`;
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Puts the requested view in a state where the production component can render:
 * review needs a queue (started the same way the dashboard starts review) and
 * priming needs a discovery pass. Settings is mounted by the shell instead.
 */
export async function prepareView(stack: RealStack, params: PlaygroundParams): Promise<void> {
	switch (params.view) {
		case 'review': {
			const controller = new DashboardController();
			await controller.startReview(IndexKey.flashcard);
			return;
		}
		case 'priming': {
			const controller = new PrimingController(stack.plugin.app);
			await controller.start({ deckFilter: undefined, deckLabel: 'All decks' });
			return;
		}
		case 'settings': {
			uiStore.currentView = 'dashboard';
			return;
		}
		default: {
			uiStore.currentView = params.view;
		}
	}
}

export function openRequestedModal(stack: RealStack, params: PlaygroundParams): void {
	if (params.modal !== 'flashcard-form') return;
	modalStore.open(ModalViewEnum.flashcard, { mode: 'create' });
	new SvelteModal(stack.plugin.app, ModalClassNames.flashcard).open();
}
