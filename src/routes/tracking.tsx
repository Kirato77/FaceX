import { Show, Suspense } from "solid-js";
import { useUserContext } from "~/components/context";

import InstructorView from "~/components/tracking-instructor";
import { TrackingInstructorProvider } from "~/components/tracking-instructor/context";
import StudentView from "~/components/tracking-student";
import { Toaster } from "~/components/ui/toast";

export default function TrackingPage() {
	
	const { user } = useUserContext();
	return (
		<Show
			when={["instructor", "admin"].includes(user()?.role || "")}
			fallback={<StudentView />}
		>
			<Toaster />
			<TrackingInstructorProvider>
				<InstructorView />
			</TrackingInstructorProvider>
		</Show>
	);
}
