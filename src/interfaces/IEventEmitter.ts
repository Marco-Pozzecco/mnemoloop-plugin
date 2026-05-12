export interface IEventEmitter<T> {
	emit: (action: T, data?: unknown) => void;
}
