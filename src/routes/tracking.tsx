import { Show, Suspense } from "solid-js";
import { useUserContext } from "~/components/context";

import InstructorView from "~/components/tracking-instructor";
import { TrackingInstructorProvider } from "~/components/tracking-instructor/context";
import StudentView from "~/components/tracking-student";
import { TrackingStudentProvider } from "~/components/tracking-student/context";

export default function TrackingPage() {
	const { user } = useUserContext();
	return (
		<Show
			when={["instructor", "admin"].includes(user()?.role || "")}
			fallback={
				<TrackingStudentProvider>
					<StudentView />
				</TrackingStudentProvider>
			}
		>
			<TrackingInstructorProvider>
				<InstructorView />
			</TrackingInstructorProvider>
		</Show>
	);
}
