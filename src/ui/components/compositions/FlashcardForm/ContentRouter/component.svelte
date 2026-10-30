<script lang="ts">
	import { CardType } from '@/schemas';
	import FormContent from '../Content';
	import type ContentRouterProps from './types';

	let {
		selectedType,
		mode,
		card,
		disabled = false,
		onRegister,
	}: ContentRouterProps = $props();
</script>

{#key selectedType}
	{#if selectedType === CardType.Basic}
		<FormContent.Basic
			{mode}
			initialContent={card?.content}
			{onRegister}
			{disabled}
		/>
	{:else if selectedType === CardType.Sequence}
		<FormContent.Sequence
			{mode}
			initialContent={card?.content}
			{onRegister}
			{disabled}
		/>
	{:else if selectedType === CardType.Quiz}
		<FormContent.Quiz
			{mode}
			initialContent={card?.content}
			{onRegister}
			{disabled}
		/>
	{:else if selectedType === CardType.Cloze}
		<FormContent.Cloze
			{mode}
			initialContent={card?.content}
			{onRegister}
			{disabled}
		/>
	{:else if selectedType === CardType.Occlusion}
		<FormContent.Occlusion
			{mode}
			initialContent={card?.content}
			{onRegister}
			{disabled}
		/>
	{/if}
{/key}
