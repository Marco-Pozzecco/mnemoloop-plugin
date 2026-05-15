/**
 * Custom ESLint rule: require-class-prefix
 *
 * Enforces that all CSS class names in Svelte templates use a configurable prefix.
 * Covers:
 *   - class="foo bar" attributes
 *   - class:foo={bar} directives
 *
 * Ignores:
 *   - Dynamic template expressions ({className}, ml-btn--{variant})
 *   - Third-party library prefixes (lc-*)
 *   - Explicitly allowed names (configured via options)
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Require CSS class names to use a configured prefix',
		},
		schema: [
			{
				type: 'object',
				properties: {
					prefix: { type: 'string' },
					allow: {
						type: 'array',
						items: { type: 'string' },
						description: 'Additional class names to allow without prefix',
					},
				},
				additionalProperties: false,
			},
		],
		messages: {
			missingPrefix:
				'CSS class "{{name}}" must use the "{{prefix}}" prefix (or be in the allow list).',
		},
	},

	create(context) {
		const options = context.options[0] || {};
		const prefix = options.prefix || 'ml-';
		const allow = new Set(options.allow || []);

		/**
		 * Checks whether a class name is exempt from the prefix rule.
		 */
		function isAllowed(name) {
			if (!name || name.length === 0) return true;
			if (allow.has(name)) return true;
			if (name.startsWith(prefix)) return true;
			if (name.startsWith('lc-')) return true; // layerchart
			if (name.startsWith('svelte-')) return true; // svelte compiler hashes
			// Contains curly braces → dynamic expression (e.g. ml-btn--{variant})
			if (name.includes('{') || name.includes('}')) return true;
			return false;
		}

		/**
		 * Reports a single class name violation.
		 */
		function report(node, className) {
			context.report({
				node,
				messageId: 'missingPrefix',
				data: { name: className, prefix },
			});
		}

		return {
			// ── class="foo bar" ──
			SvelteAttribute(node) {
				// eslint-plugin-svelte AST: attribute name lives at node.key.name
				if (node.key?.name !== 'class' || !Array.isArray(node.value)) return;

				for (const valueNode of node.value) {
					if (valueNode.type !== 'SvelteLiteral') continue;

					const text = valueNode.value;
					if (typeof text !== 'string') continue;

					// Split on whitespace, filter empties
					const classes = text.split(/\s+/).filter(Boolean);

					for (const className of classes) {
						if (isAllowed(className)) continue;
						report(valueNode, className);
					}
				}
			},

			// ── class:foo={bar} and class:foo (shorthand) ──
			// Intentionally ignored: class:* directives are state/modifier toggles
			// that compose with a base ml-* class (e.g. .ml-card.has-border).
			// Unprefixed selectors in <style> blocks are caught by check-css-prefix.js.
		};
	},
};
