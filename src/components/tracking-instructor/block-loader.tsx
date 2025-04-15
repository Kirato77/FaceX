import { createEffect, createResource } from "solid-js";
import { getClassBlocksByCourseId } from "~/supabase-client";
import { useTrackingInstructorContext } from "./context";
import { reconcile } from "solid-js/store";
export function BlockLoader() {
  const { selectedCourseId, setSelectedBlockId, setBlocks } = useTrackingInstructorContext();

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