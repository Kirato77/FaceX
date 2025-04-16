import { createEffect, createResource } from "solid-js";
import { reconcile } from "solid-js/store";
import { getGroupsByList } from "~/supabase-client";
import { useTrackingInstructorContext } from "./context";

export function GroupsByListLoader() {
	const { selectedGroup, setGroupsByList } = useTrackingInstructorContext();

	const [groups] = createResource(
		selectedGroup,
		async (group) => {
			if (!group) return [];
			return getGroupsByList(group.id);
		},
		{ initialValue: [] },
	);

	createEffect(() => {
		setGroupsByList(reconcile(groups()));
	});

	return <></>;
}
