<script lang="ts">
	import { Icon, NavigationMenu } from '@/ui/components/elements';
	import type NavbarProps from './types';

	let { activeTab = $bindable('dashboard'), onTabChange, className = '' }: NavbarProps = $props();

	const tabs = [
		{ value: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
		{ value: 'analytics', icon: 'bar-chart-3', label: 'Analytics' },
	] as const;

	function handleValueChange(value: string) {
		if (value.length === 0 || value === activeTab) return;
		const tab = value as 'dashboard' | 'analytics';
		activeTab = tab;
		onTabChange?.(tab);
	}
</script>

<nav class="ml-navbar {className}">
	<NavigationMenu.Root value={activeTab} onValueChange={handleValueChange}>
		<NavigationMenu.List>
			{#each tabs as tab (tab.value)}
				<NavigationMenu.Item value={tab.value} openOnHover={false}>
					<NavigationMenu.Trigger>
						<Icon name={tab.icon} />{tab.label}
					</NavigationMenu.Trigger>
				</NavigationMenu.Item>
			{/each}
			<NavigationMenu.Indicator />
		</NavigationMenu.List>
	</NavigationMenu.Root>
</nav>

<style lang="scss">
	@use 'tokens' as *;

	.ml-navbar {
		border-bottom: 1px solid $background-modifier-border;
	}

	@media (max-width: 480px) {
		.ml-navbar {
			position: fixed;
		bottom: calc($navbar-bottom-offset + $navbar-height + $spacing-xs);
			left: 0;
			right: 0;
			z-index: 50;
		height: $navbar-height;
			background-color: $background-primary;
			border-top: 1px solid $background-modifier-border;
			border-bottom: none;
			padding-bottom: env(safe-area-inset-bottom, 0);
		}

		:global(.ml-navbar .ml-navmenu__list) {
			justify-content: space-around;
			width: 100%;
			padding: $spacing-xs $spacing-sm;
		}

		:global(.ml-navbar button.ml-navmenu__trigger) {
			flex-direction: column;
			border-radius: 0;
		gap: $spacing-xxs;
		padding: $spacing-xs $spacing-sm;
			min-height: 48px;
			min-width: 48px;
			font-size: 10px;
		}

		:global(.ml-navbar button.ml-navmenu__trigger[data-state='open']) {
			color: $interactive-accent;
			background-color: transparent;
			border-bottom: 1px solid $interactive-accent;
		}

		:global(.ml-navbar .ml-navmenu__indicator) {
			display: none;
		}
	}
</style>
