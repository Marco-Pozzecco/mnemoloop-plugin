export function simpleClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}
