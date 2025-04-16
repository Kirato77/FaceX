import { createEffect, createResource } from "solid-js";
import { reconcile } from "solid-js/store";
import { getStudentAttenceStatus } from "~/supabase-client";
import { useTrackingStudentContext } from "./context";
export default function AttendancesLoader() {
	const { setStudentAttendanceStatus, studentEmail } =
		useTrackingStudentContext();

	const [getStudentAttendancesStatus] = createResource(
		studentEmail,
		async (email) => {
			if (!email) return { present: 0, absent: 0, retard: 0 };
			const data = await getStudentAttenceStatus(email);
			return data;
		},
		{ initialValue: { present: 0, absent: 0, retard: 0 } },
	);

	createEffect(() => {
		setStudentAttendanceStatus(reconcile(getStudentAttendancesStatus()));
	});

	return <></>;
}
