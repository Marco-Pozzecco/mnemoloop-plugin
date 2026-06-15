import { EventBus } from '@/modules/events';
import { DashboardOpenEvent } from '@/modules/events/domains/ui/dashboard';
import type { BannerConfig } from '@/ui/components/elements/Banner/types';
import { settingsStore } from '@/ui/store/settings.store';
import { writable, type Writable } from 'svelte/store';

interface BannerStoreState {
	activeBanner: BannerConfig | null;
}

const BANNER_DEFINITIONS: BannerConfig[] = [
	{
		id: 'github-feedback',
		view: 'dashboard',
		message: 'Want a new feature or suggest an improvement?',
		link: {
			label: 'Open an issue',
			url: 'https://github.com/Marco-Pozzecco/mnemoloop-plugin/issues',
		},
	},
];

export class BannerStore {
	private _store: Writable<BannerStoreState>;
	private _unsubscribe: () => void = () => {};

	constructor() {
		this._store = writable<BannerStoreState>({ activeBanner: null });
	}

	get store(): Writable<BannerStoreState> {
		return this._store;
	}

	init(): void {
		// Already initialized — unsubscribe previous subscription
		this._unsubscribe();
		const handler = async () => {
			this.evaluate();
		};
		this._unsubscribe = EventBus.instance.subscribe(DashboardOpenEvent, handler);
	}

	dismiss(bannerId: string): void {
		const dismissals = {
			...(settingsStore.currentSettings.banner_dismissals ?? {}),
			[bannerId]: todayISO(),
		};
		// Update in-memory immediately so evaluate() sees the new state
		settingsStore.settings.update((s) => ({ ...s, banner_dismissals: dismissals }));
		// Persist via event bus (fire-and-forget)
		void settingsStore.updateField('banner_dismissals', dismissals);
		void settingsStore.save();
		this._store.update((s) => ({ ...s, activeBanner: null }));
		this.evaluate();
	}

	dispose(): void {
		this._unsubscribe();
	}

	private evaluate(): void {
		for (const banner of BANNER_DEFINITIONS) {
			if (this.isDismissedToday(banner.id)) continue;
			if (!this.meetsCondition(banner)) continue;

			this._store.update((s) => ({ ...s, activeBanner: banner }));
			return;
		}
		this._store.update((s) => ({ ...s, activeBanner: null }));
	}

	private isDismissedToday(bannerId: string): boolean {
		const dismissals = settingsStore.currentSettings.banner_dismissals ?? {};
		return dismissals[bannerId] === todayISO();
	}

	private meetsCondition(banner: BannerConfig): boolean {
		switch (banner.id) {
			case 'github-feedback':
				return true;
			default:
				return false;
		}
	}
}

function todayISO(): string {
	return new Date().toISOString().slice(0, 10);
}

export const bannerStore = new BannerStore();
