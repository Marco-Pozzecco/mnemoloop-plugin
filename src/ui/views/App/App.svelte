<script lang="ts">
  import { navigationState } from './NavigationManager';
  import Dashboard from '../Dashboard/Dashboard.svelte';
  import Review from '../Review/Review.svelte';
</script>

{#if $navigationState.currentView === 'dashboard'}
  <Dashboard />
{:else if $navigationState.currentView === 'review'}
  <Review />
{/if}
