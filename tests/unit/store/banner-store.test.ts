import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { bannerStore } from '@/ui/store/banner.store';
import { settingsStore } from '@/ui/store/settings.store';
import { statsStore } from '@/ui/store/stats.store';
import { EventBus, DashboardOpenEvent } from '@/modules/events';
import { DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';
import { DEFAULT_STATISTICS } from '@/utils/constants';

function todayISO(): string {
	return new Date().toISOString().slice(0, 10);
}

describe('BannerStore', () => {
	beforeEach(() => {
		// Reset singletons to defaults
		settingsStore.settings.set({
			...DEFAULT_PLUGIN_SETTINGS,
			banner_dismissals: {},
		});
		statsStore.stats = { ...DEFAULT_STATISTICS };
		// Always re-init for clean handler state
		bannerStore.init();
	});

	afterEach(() => {
		bannerStore.dispose();
	});

	it('evaluate should return github-feedback when no dismissals', async () => {
		await EventBus.instance.publish(new DashboardOpenEvent());

		let state: { activeBanner: unknown } | null = null;
		const unsub = bannerStore.store.subscribe((s) => (state = s));
		expect(state?.activeBanner).not.toBeNull();
		expect((state?.activeBanner as { id: string }).id).toBe('github-feedback');
		unsub();
	});

	it('evaluate should return null when github-feedback dismissed today and recent review', async () => {
		settingsStore.settings.set({
			...DEFAULT_PLUGIN_SETTINGS,
			banner_dismissals: { 'github-feedback': todayISO() },
		});
		statsStore.stats = {
			...DEFAULT_STATISTICS,
			progress: {
				[todayISO()]: {
					total_count: 10,
					correct_count: 8,
					incorrect_count: 2,
					retention_rate: 0.8,
					sessions_completed: 1,
					total_duration: 120,
					goal_completed: true,
				},
			},
		};

		await EventBus.instance.publish(new DashboardOpenEvent());

		let state: { activeBanner: unknown } | null = null;
		const unsub = bannerStore.store.subscribe((s) => (state = s));
		expect(state?.activeBanner).toBeNull();
		unsub();
	});

	it('dismiss should clear dismissed banner and show next if applicable', () => {
		bannerStore.store.update(() => ({
			activeBanner: {
				id: 'github-feedback',
				view: 'dashboard' as const,
				message: 'Test',
			},
		}));

		bannerStore.dismiss('github-feedback');

		let state: { activeBanner: unknown } | null = null;
		const unsub = bannerStore.store.subscribe((s) => (state = s));
		expect(state?.activeBanner).toBe(null);
		unsub();
	});

	it('dismiss should clear all banners when all dismissed and recent review', () => {
		// Set recent review progress so idle-reminder doesn't trigger
		statsStore.stats = {
			...DEFAULT_STATISTICS,
			progress: {
				[todayISO()]: {
					total_count: 5,
					correct_count: 4,
					incorrect_count: 1,
					retention_rate: 0.8,
					sessions_completed: 1,
					total_duration: 60,
					goal_completed: false,
				},
			},
		};
		// Dismiss both banners
		settingsStore.settings.update((s) => ({
			...s,
			banner_dismissals: { 'github-feedback': todayISO(), 'idle-reminder': todayISO() },
		}));

		bannerStore.store.update(() => ({
			activeBanner: {
				id: 'github-feedback',
				view: 'dashboard' as const,
				message: 'Test',
			},
		}));

		bannerStore.dismiss('github-feedback');

		let state: { activeBanner: unknown } | null = null;
		const unsub = bannerStore.store.subscribe((s) => (state = s));
		expect(state?.activeBanner).toBeNull();
		unsub();
	});
});
