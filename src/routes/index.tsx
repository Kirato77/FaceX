import { Show } from "solid-js";
import { useUserContext } from "~/components/context";

export default function Home() {
	const { user } = useUserContext();

	return (
		<main class="container mx-auto p-6">
			<Show when={user()} fallback="User is not defined">
				<div class="text-center">
					<h1 class="text-4xl font-bold mb-4">Welcome to FaceX</h1>
					<p class="text-xl text-gray-600 mb-8">
						Facial Recognition Attendance System
					</p>

					<Show when={user()?.role === "admin"}>
						<div class="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-lg max-w-md mx-auto">
							<h2 class="text-2xl font-bold mb-2">Admin Dashboard</h2>
							<p class="mb-4">
								You have full access to manage users, courses, and system
								settings.
							</p>
							<div class="space-y-2 text-left">
								<div class="flex items-center gap-2">
									<span>👥</span>
									<span>Manage Users</span>
								</div>
								<div class="flex items-center gap-2">
									<span>📊</span>
									<span>View Analytics</span>
								</div>
								<div class="flex items-center gap-2">
									<span>⚙️</span>
									<span>System Settings</span>
								</div>
							</div>
						</div>
					</Show>

					<Show when={user()?.role === "instructor"}>
						<div class="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-lg max-w-md mx-auto">
							<h2 class="text-2xl font-bold mb-2">Instructor Dashboard</h2>
							<p class="mb-4">
								You can manage attendance, create groups, and track student
								progress.
							</p>
							<div class="space-y-2 text-left">
								<div class="flex items-center gap-2">
									<span>📷</span>
									<span>Take Attendance</span>
								</div>
								<div class="flex items-center gap-2">
									<span>👥</span>
									<span>Create Groups</span>
								</div>
								<div class="flex items-center gap-2">
									<span>📊</span>
									<span>View Reports</span>
								</div>
							</div>
						</div>
					</Show>

					<Show when={user()?.role === "student"}>
						<div class="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-lg max-w-md mx-auto">
							<h2 class="text-2xl font-bold mb-2">Student Dashboard</h2>
							<p class="mb-4">
								Track your attendance and view your course information.
							</p>
							<div class="space-y-2 text-left">
								<div class="flex items-center gap-2">
									<span>📊</span>
									<span>View Attendance</span>
								</div>
								<div class="flex items-center gap-2">
									<span>📚</span>
									<span>Course Info</span>
								</div>
								<div class="flex items-center gap-2">
									<span>📈</span>
									<span>Progress Stats</span>
								</div>
							</div>
						</div>
					</Show>

					<div class="mt-8 text-gray-500">
						<p>
							Logged in as: <span class="font-semibold">{user()?.email}</span>
						</p>
						<p>
							Role: <span class="font-semibold capitalize">{user()?.role}</span>
						</p>
					</div>
				</div>
			</Show>
		</main>
	);
}
