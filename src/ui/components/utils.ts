export function cn(...inputs: (string | undefined | Record<string, boolean>)[]) {
	let computedClass = '';
	const classes: Set<string> = new Set();

	for (const input of inputs) {
		if (!input) continue;
		if (typeof input === 'string') {
			classes.add(input);
		} else {
			for (const key in input) {
				const value = input[key];
				if (value === true) {
					classes.add(key);
				}
			}
		}
	}

	classes.forEach((value) => (computedClass += value + ' '));

	return computedClass.trim();
}
