import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: ['out/test/**/*.test.js', 'tests/**/*.test.ts'],
	mocha: {
		require: ['ts-node/register']
	}
});
