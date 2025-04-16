import { createEffect, createResource } from "solid-js";
import { reconcile } from "solid-js/store";
import { getGroupsByCourse } from "~/supabase-client";
import { useTrackingInstructorContext } from "./context";

export function GroupsForCourseLoader() {
	const { selectedCourseId, setGroupsForCourse, onRefetchGroupsForCourse } =
		useTrackingInstructorContext();

	const [groups, { refetch }] = createResource(
		selectedCourseId,
		async (courseId) => {
			if (!courseId) return [];
			return getGroupsByCourse(courseId);
		},
		{ initialValue: [] },
	);

	onRefetchGroupsForCourse(() => {
		refetch();
	});

	createEffect(() => {
		console.log(groups());
		setGroupsForCourse(reconcile(groups()));
	});

	return <></>;
}
