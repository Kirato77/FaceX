import { createEffect, createResource } from "solid-js";
import { reconcile } from "solid-js/store";
import { getClassBlocksByCourseId } from "~/supabase-client";
import { useTrackingInstructorContext } from "./context";
export function BlockLoader() {
	const { selectedCourseId, setSelectedBlockId, setBlocks } =
		useTrackingInstructorContext();

	const [blocks] = createResource(
		selectedCourseId,
		async (selectedCourseId) => {
			if (!selectedCourseId) return [];
			setSelectedBlockId(undefined);
			return getClassBlocksByCourseId(selectedCourseId);
		},
		{ initialValue: [] },
	);

	createEffect(() => {
		setBlocks(reconcile(blocks()));
	});

	return <></>;
}
