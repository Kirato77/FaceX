import { createEffect, createResource } from "solid-js";
import { reconcile } from "solid-js/store";
import { getAttendanceForClassBlock } from "~/supabase-client";
import { useTrackingInstructorContext } from "./context";

export function AttendancesLoader() {
	const { selectedBlockId, setAttendances, onRefetchAttendances } =
		useTrackingInstructorContext();

	const [attendances, { refetch: refetchAttendances }] = createResource(
		selectedBlockId,
		async (blockId) => {
			if (!blockId) return [];
			return getAttendanceForClassBlock(blockId);
		},
		{ initialValue: [] },
	);

	onRefetchAttendances(() => {
		refetchAttendances();
	});

	createEffect(() => {
		setAttendances(reconcile(attendances()));
	});

	return <></>;
}
