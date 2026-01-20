import { IndexRecoveryResult, SyncConflict } from './types';

export interface ISyncNotifier {
	notifyConflict(conflict: SyncConflict): void;
	logError(message: string): void;
}

export interface IRecoveryNotifier {
	notifyRecoveryStarted(): void;
	notifyRecoveryComplete(result: IndexRecoveryResult): void;
	logError(file: string, error: string): void;
}
