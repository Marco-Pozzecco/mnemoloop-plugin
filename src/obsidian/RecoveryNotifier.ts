import { Notice } from 'obsidian';
import { IRecoveryNotifier, IndexRecoveryResult } from '../core/sync/types';

export class RecoveryNotifier implements IRecoveryNotifier {
	notifyRecoveryStarted(): void {
		new Notice('Knowledge Accelerator: Index corruption detected. Starting automatic rebuild...');
	}

	notifyRecoveryComplete(result: IndexRecoveryResult): void {
		if (result.success) {
			if (result.cards_failed === 0) {
				new Notice(`Knowledge Accelerator: Rebuild complete. ${result.cards_recovered} cards recovered in ${Math.round(result.duration_ms)}ms.`);
			} else {
				new Notice(`Knowledge Accelerator: Rebuild complete with issues. ${result.cards_recovered} recovered, ${result.cards_failed} failed. Check console for details.`);
			}
		} else {
			new Notice('Knowledge Accelerator: Critical error during index rebuild. Please check console.');
		}
	}

	logError(file: string, error: string): void {
		console.error(`Knowledge Accelerator Rebuild Error [${file}]: ${error}`);
	}
}
