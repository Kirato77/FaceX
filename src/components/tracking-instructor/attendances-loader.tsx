import { createEffect, createResource } from "solid-js";
import { getAttendanceForClassBlock } from "~/supabase-client";
import { useTrackingInstructorContext } from "./context";
import { reconcile } from "solid-js/store";

export function AttendancesLoader() {
	const { selectedBlockId, setAttendances, onRefetchAttendances } = useTrackingInstructorContext();
  
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