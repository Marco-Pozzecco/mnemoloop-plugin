// Resolvable target for `import ... from 'obsidian'` in the vitest client
// (jsdom) pipeline. The types-only `obsidian` package has no JS entry, which the
// client pipeline cannot resolve. tests/setup.ts's `vi.mock('obsidian', ...)`
// replaces this module at runtime for all tests.
export {};
