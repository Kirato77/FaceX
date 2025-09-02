import { createEffect, createResource } from "solid-js";
import { reconcile } from "solid-js/store";
import { getAllCourses, getCoursesByInstructorId } from "~/supabase-client";
import { getSessionEmail, useUserContext } from "../context";
import { useTrackingInstructorContext } from "./context";

export function CourseLoader() {
	const email = getSessionEmail;
	const { user } = useUserContext();
	const { setCourses, setSelectedCourseId, onRefetchCourses } =
		useTrackingInstructorContext();

	const [courses, { refetch: refetchCourses }] = createResource(
		[email, user],
		async ([email, user]) => {
			const userEmail = typeof email === "function" ? email() : email;
			const userData = typeof user === "function" ? user() : user;

			if (!userEmail || typeof userEmail !== "string") return [];

			// Si l'utilisateur est admin, récupérer tous les cours
			if (
				userData &&
				typeof userData === "object" &&
				"role" in userData &&
				userData.role === "admin"
			) {
				return getAllCourses();
			}

			// Sinon, récupérer seulement les cours de l'instructeur
			return getCoursesByInstructorId(userEmail);
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
