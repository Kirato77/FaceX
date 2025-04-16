import { defineConfig } from "@solidjs/start/config";
import Icons from "unplugin-icons/vite";

export default defineConfig({
	ssr: false,
	vite: {
		plugins: [
			Icons({
				compiler: "solid",
			}),
		],
	},
});
