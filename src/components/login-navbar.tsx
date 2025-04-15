import { useColorMode } from "@kobalte/core";
import { Show, createResource, createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import { supabase } from "~/supabase-client";
import IconMicrosoftFill from "~icons/ri/microsoft-fill";
import IconMoonLine from "~icons/ri/moon-line";
import IconSunLine from "~icons/ri/sun-line";
import IconWebcamLine from "~icons/ri/webcam-line";

export default function LoginNavbar() {
	const [loading, setLoading] = createSignal(false);
	const handleLogin = async (e: MouseEvent) => {
		e.preventDefault();

		try {
			setLoading(true);
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "azure",
				options: {
					redirectTo: window.location.host,
					scopes: "email",
				},
			});
			if (error) throw error;
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message);
			}
		} finally {
			setLoading(false);
		}
	};

	const { colorMode, setColorMode } = useColorMode();

	return (
		<nav
			class={`flex items-right justify-between p-4 ${colorMode() === "light" ? "bg-gray-100" : "bg-gray-900"} shadow-md sticky top-0 z-50`}
		>
			<div class="flex items-center">
				<IconWebcamLine class="w-8 h-8 mr-1" />
				FaceX
			</div>

			<div class="flex items-center space-x-6">
				<div class="flex items-center group cursor-pointer">
					<Button
						onClick={handleLogin}
						disabled={loading()}
						onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && handleLogin}
						role="button"
						tabIndex={0}
					>
						<IconMicrosoftFill class="mr-2" />
						Login with Microsoft
					</Button>
				</div>
				<div
					class="flex items-center group cursor-pointer"
					onClick={() =>
						setColorMode(colorMode() === "light" ? "dark" : "light")
					}
					onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && handleLogin}
					tabIndex={0}
				>
					<Show
						when={colorMode() === "light"}
						fallback={<IconMoonLine class="w-5 h-5 mr-1" />}
					>
						<IconSunLine class="w-5 h-5 mr-1" />
					</Show>
				</div>
			</div>
		</nav>
	);
}
