import solidPlugin from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [solidPlugin()],
	test: {
		setupFiles: ["./vitest.setup.ts"],
		browser: {
			provider: "playwright",
			enabled: true,
			headless: true,
			instances: [{ browser: "firefox" }],
		},
	},
});
