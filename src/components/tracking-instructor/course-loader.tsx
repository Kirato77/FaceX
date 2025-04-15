import { createEffect, createResource } from "solid-js";
import { getCoursesByInstructorId } from "~/supabase-client";
import { useTrackingInstructorContext } from "./context";
import { getSessionEmail } from "../context";
import { reconcile } from "solid-js/store";

export function CourseLoader() {
	const email = getSessionEmail;
  const { setCourses, setSelectedCourseId, onRefetchCourses } = useTrackingInstructorContext();

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