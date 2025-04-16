import { createEffect, createResource } from "solid-js";
import { reconcile } from "solid-js/store";
import { getAttendanceByEmail } from "~/supabase-client";
import { getSessionEmail } from "../context";
import { useTrackingStudentContext } from "./context";
export default function AttendancesLoader() {
	const studentEmail = getSessionEmail;

	const { setStudentAttendances, onRefetchStudentAttendances } =
		useTrackingStudentContext();

	const [studentAttendances, { refetch }] = createResource(
		studentEmail,
		async (email) => {
			if (!email) return [];
			const data = await getAttendanceByEmail(email);
			return data;
		},
		{ initialValue: [] },
	);

	createEffect(() => {
		setStudentAttendances(reconcile(studentAttendances()));
	});

	onRefetchStudentAttendances(() => {
		refetch();
	});

	return <></>;
}
