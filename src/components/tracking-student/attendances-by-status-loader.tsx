import { createEffect, createResource } from "solid-js";
import { reconcile } from "solid-js/store";
import { getAttendanceByEmail, getAttendanceByStatus } from "~/supabase-client";
import { getSessionEmail } from "../context";
import { useTrackingStudentContext } from "./context";
export default function AttendancesLoader() {
	const studentEmail = getSessionEmail;

	const { setStudentAttendancesByStatus, selectedstats } =
		useTrackingStudentContext();

	const [studentAttendencesByStatus] = createResource(
		selectedstats,
		async (status) => {
			if (!status || !studentEmail()) return [];
			const data = await getAttendanceByStatus(studentEmail()!, status);
			return data ?? [];
		},
		{ initialValue: [] },
	);

	createEffect(() => {
		setStudentAttendancesByStatus(reconcile(studentAttendencesByStatus()));
	});

	return <></>;
}
