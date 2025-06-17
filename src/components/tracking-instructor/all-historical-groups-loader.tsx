import { createEffect, createResource } from "solid-js";
import { reconcile } from "solid-js/store";
import {
	type User,
	getGroupsByCourse,
	getGroupsByList,
} from "~/supabase-client";
import { useTrackingInstructorContext } from "./context";

export function AllHistoricalGroupsLoader() {
	const { selectedCourseId, setAllHistoricalGroups } =
		useTrackingInstructorContext();

	const [historicalGroups] = createResource(
		selectedCourseId,
		async (courseId) => {
			if (!courseId) return [];
			const groupsData = await getGroupsByCourse(courseId);
			const allGroups: User[][][] = [];
			for (const group of groupsData) {
				const usersInGroup = await getGroupsByList(group.id);
				allGroups.push(usersInGroup);
			}
			return allGroups;
		},
		{ initialValue: [] },
	);

	createEffect(() => {
		setAllHistoricalGroups(reconcile(historicalGroups()));
	});

	return <></>;
}
