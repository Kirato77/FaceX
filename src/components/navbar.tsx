import { useColorMode } from "@kobalte/core";
import { useLocation } from "@solidjs/router";
import { Show, createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { showToast } from "~/components/ui/toast";
import { supabase } from "~/supabase-client";
import IconCheckboxCircleLine from "~icons/ri/checkbox-circle-line";
import IconLogoutBoxLine from "~icons/ri/logout-box-line";
import IconMoonLine from "~icons/ri/moon-line";
import IconSunLine from "~icons/ri/sun-line";
import IconUserLine from "~icons/ri/user-line";
import IconWebcamLine from "~icons/ri/webcam-line";
import { UserContextProvider, useUserContext } from "./context";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

export default function Navbar() {
	const { user } = useUserContext();
	const location = useLocation();
	const { colorMode, setColorMode } = useColorMode();
	const [open, setOpen] = createSignal(false);
	const [pushEnabled, setPushEnabled] = createSignal(false);

	async function handleEnablePushNotifications() {
		if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
		try {
			await navigator.serviceWorker.register("/sw.js");
			const permission = await Notification.requestPermission();
			if (permission !== "granted") {
				showToast({
					title: "Permission refusée",
					description:
						"Vous devez autoriser les notifications pour recevoir les push.",
					variant: "warning",
				});
				return;
			}
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
			});
			const user_email = user()?.email;
			if (user_email) {
				const subscriptionObj = subscription.toJSON();
				await supabase.from("webpush_subscriptions").upsert({
					user_email,
					subscription: subscriptionObj,
					endpoint: subscriptionObj.endpoint,
				});
				setPushEnabled(true);
				showToast({
					title: "Notifications activées",
					description: "Vous recevrez désormais des notifications push.",
					variant: "success",
				});
			}
		} catch (err) {
			showToast({
				title: "Erreur",
				description: "Impossible d'activer les notifications push.",
				variant: "error",
			});
		}
	}

	return (
		<nav
			class={`flex items-right justify-between p-4 ${colorMode() === "light" ? "bg-gray-100" : "bg-gray-900"} shadow-md sticky top-0 z-50`}
		>
			<div class="flex items-center">
				<a href="/" class="flex flex-row font-bold text-lg">
					<IconWebcamLine class="w-8 h-8 mr-1" />
					FaceX
				</a>
			</div>

			<div class="flex items-center space-x-6">
				<div class="flex items-center group cursor-pointer">
					<a
						href="/tracking"
						class={`flex flex-row ${location.pathname === "/tracking" ? "text-blue-500" : "group-hover:text-blue-500"}`}
					>
						<IconCheckboxCircleLine class="w-6 h-6 mr-1" />
						Tracking
					</a>
				</div>
				<div class="flex items-center group cursor-pointer">
					<DropdownMenu>
						<DropdownMenuTrigger class="flex flex-row group-hover:text-blue-500">
							<IconUserLine class="w-6 h-6 mr-1" />
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>{`My Account -  ${user()?.role}`}</DropdownMenuLabel>
							<DropdownMenuLabel>{user()?.email}</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onSelect={() =>
									setColorMode(colorMode() === "light" ? "dark" : "light")
								}
							>
								<Show
									when={colorMode() === "light"}
									fallback={<IconMoonLine class="w-5 h-5 mr-1" />}
								>
									<IconSunLine class="w-5 h-5 mr-1" />
								</Show>
								Toggle theme
							</DropdownMenuItem>
							{!pushEnabled() && (
								<DropdownMenuItem onSelect={handleEnablePushNotifications}>
									🔔 Activer les notifications push
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								class="!text-red-600"
								onSelect={() => setOpen(true)}
							>
								<IconLogoutBoxLine class="w-5 h-5 mr-1" />
								Log out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Dialog open={open()} onOpenChange={setOpen}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Are you sure ?</DialogTitle>
								<DialogDescription>
									You are about to be disconnected.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									variant="destructive"
									onClick={() => supabase.auth.signOut()}
								>
									Confirm
								</Button>
								<Button variant="secondary" onClick={() => setOpen(false)}>
									Cancel
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</nav>
	);
}
