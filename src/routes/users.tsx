import { Show, Suspense } from "solid-js";
import { useUserContext } from "~/components/context";
import { UsersManagement } from "~/components/users-management";

export default function UsersPage() {
	const { user } = useUserContext();

	return (
		<Show
			when={user()?.role === "admin"}
			fallback={
				<div class="flex items-center justify-center min-h-screen">
					<div class="text-center">
						<h1 class="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
						<p class="text-gray-600">
							You need admin privileges to access this page.
						</p>
					</div>
				</div>
			}
		>
			<Suspense fallback={<div>Loading...</div>}>
				<UsersManagement />
			</Suspense>
		</Show>
	);
}
