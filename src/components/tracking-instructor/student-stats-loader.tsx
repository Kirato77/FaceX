import { createEffect, createResource } from "solid-js";
import { getStudentStatsForCourse } from "~/supabase-client";
import { useTrackingInstructorContext } from "./context";

export function StudentStatsLoader() {
	const {
		selectedStudent,
		selectedCourseId,
		setStudentStats,
		onRefetchStudentStats,
	} = useTrackingInstructorContext();

	const [studentStats, { refetch: refetchStudentStats }] = createResource(
		() => [selectedStudent(), selectedCourseId()] as const,
		async ([selectedStudent, selectedCourseId]) => {
			if (!selectedStudent || !selectedCourseId) return null;
			return getStudentStatsForCourse(
				selectedCourseId,
				selectedStudent.student_email,
			);
		},
	);

	createEffect(() => {
		setStudentStats(studentStats());
	});

	onRefetchStudentStats(() => {
		refetchStudentStats();
	});

	return <></>;
}
