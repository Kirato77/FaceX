import { MetaProvider, Title } from "@solidjs/meta";
import { Route, Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import {
	Index,
	Show,
	Suspense,
	createEffect,
	createSignal,
	getOwner,
	onCleanup,
	onMount,
	runWithOwner,
} from "solid-js";
import "@fontsource/inter";
import "./app.css";

import type { AuthSession } from "@supabase/supabase-js";
import Navbar from "./components/navbar";
import Login from "./login";
import { supabase } from "./supabase-client";

import { isServer } from "solid-js/web";

import {
	ColorModeProvider,
	ColorModeScript,
	cookieStorageManagerSSR,
} from "@kobalte/core";
import { getCookie } from "vinxi/http";
import LoginNavbar from "~/components/login-navbar";
import {
	UserContextProvider,
	getSessionEmail,
	useUserContext,
} from "./components/context";
import { Toaster, showToast } from "./components/ui/toast";

function getServerCookies() {
	"use server";
	const colorMode = getCookie("kb-color-mode");
	return colorMode ? `kb-color-mode=${colorMode}` : "";
}

function NotificationsListener() {
	const { user } = useUserContext();
	const owner = getOwner();

	createEffect(() => {
		if (!user() || !user()?.email) return;
		const notificationsChannel = supabase
			.channel("notifications")
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "notifications" },
				(payload) =>
					runWithOwner(owner, () => {
						const notif = payload.new;
						const allowedVariants = [
							"default",
							"success",
							"destructive",
							"error",
							"warning",
						];
						const variant = allowedVariants.includes(notif.type)
							? notif.type
							: "default";
						if (notif.user_email === user()?.email) {
							showToast({
								title: notif.title,
								description: (
									<>
										<Index each={notif.description.split(",")}>
											{(part, i) => (
												<span>
													{part().trim()}
													{i < notif.description.split(",").length - 1 && (
														<br />
													)}
												</span>
											)}
										</Index>
									</>
								),
								variant,
							});
						}
					}),
			)
			.subscribe();

		onCleanup(() => {
			notificationsChannel.unsubscribe();
		});
	});

	return null;
}

export default function App() {
	const [session, setSession] = createSignal<AuthSession>();

	supabase.auth.getSession().then(({ data: { session } }) => {
		setSession(session ?? undefined);
	});

	supabase.auth.onAuthStateChange((_event, session) => {
		setSession(session ?? undefined);
	});

	const storageManager = cookieStorageManagerSSR(
		isServer ? getServerCookies() : document.cookie,
	);

	return (
		<Router
			root={(props) => (
				<MetaProvider>
					<UserContextProvider>
						<NotificationsListener />
						<ColorModeScript storageType={storageManager.type} />
						<ColorModeProvider storageManager={storageManager}>
							<Title>FaceX</Title>
							<Show when={session()} fallback={<LoginNavbar />}>
								<Navbar />
							</Show>
							<Suspense>{props.children}</Suspense>
							<Toaster />
						</ColorModeProvider>
					</UserContextProvider>
				</MetaProvider>
			)}
		>
			<Show when={session()} fallback={<Route path="*" component={Login} />}>
				<FileRoutes />
			</Show>
		</Router>
	);
}
