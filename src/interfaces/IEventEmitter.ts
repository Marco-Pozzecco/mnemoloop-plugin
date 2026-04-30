export interface IEventEmitter<T> {
	emit: (action: T) => void;
}
