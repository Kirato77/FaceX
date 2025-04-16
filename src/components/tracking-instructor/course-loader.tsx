import { createEffect, createResource } from "solid-js";
import { reconcile } from "solid-js/store";
import { getCoursesByInstructorId } from "~/supabase-client";
import { getSessionEmail } from "../context";
import { useTrackingInstructorContext } from "./context";

export function CourseLoader() {
	const email = getSessionEmail;
	const { setCourses, setSelectedCourseId, onRefetchCourses } =
		useTrackingInstructorContext();

	const [courses, { refetch: refetchCourses }] = createResource(
		email,
		async (email) => {
			if (!email) return [];
			return getCoursesByInstructorId(email);
		},
		{ initialValue: [] },
	);

	onRefetchCourses(() => {
		refetchCourses();
	});

	createEffect(() => {
		setCourses(reconcile(courses()));
	});

	return <></>;
}
