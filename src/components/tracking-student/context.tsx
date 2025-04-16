import {
	type Accessor,
	type ParentProps,
	Setter,
	createContext,
	createMemo,
	createSignal,
	useContext,
} from "solid-js";
import { type SetStoreFunction, createStore } from "solid-js/store";
import type {
	Attendance,
	AttendanceForClassBlock,
	Block,
	Course,
	StudentAttendanceStatus,
} from "~/supabase-client";
import { getSessionEmail, useUserContext } from "../context";

export interface TrackingStudentContextValue {
	studentAttendances: Attendance[];
	setStudentAttendances: SetStoreFunction<Attendance[]>;
	refetchStudentAttendances: () => void;
	onRefetchStudentAttendances: (callback: () => void) => void;
	studentAttendancesByStatus: Attendance[];
	setStudentAttendancesByStatus: SetStoreFunction<Attendance[]>;
	studentAttendanceStatus: StudentAttendanceStatus;
	setStudentAttendanceStatus: SetStoreFunction<StudentAttendanceStatus>;
	selectedstats: Accessor<"Present" | "Absent" | "Retard">;
	setSelectedstats: (status: "Present" | "Absent" | "Retard") => void;
	studentEmail: Accessor<string>;
}

export const TrackingStudentContext =
	createContext<TrackingStudentContextValue>();

export function useTrackingStudentContext() {
	const context = useContext(TrackingStudentContext);

	if (context === undefined) {
		throw new Error(
			"[FaceX]: `useTrackingStudentContext` must be used within a `TrackingStudentProvider` component",
		);
	}

	return context as TrackingStudentContextValue;
}

export function TrackingStudentProvider(props: ParentProps) {
	const { user } = useUserContext();

	console.log(user());

	const [studentAttendances, setStudentAttendances] = createStore<Attendance[]>(
		[],
	);
	const [studentAttendancesByStatus, setStudentAttendancesByStatus] =
		createStore<Attendance[]>([]);
	const [studentAttendanceStatus, setStudentAttendanceStatus] =
		createStore<StudentAttendanceStatus>({ absent: 0, present: 0, retard: 0 });

	const [getOnRefetchStudentAttendances, onRefetchStudentAttendances] =
		createSignal<() => void>();

	const [selectedstats, setSelectedstats] = createSignal<
		"Present" | "Absent" | "Retard"
	>("Present");

	return (
		<TrackingStudentContext.Provider
			value={{
				studentEmail: () => {
					console.log("AAAAAAAAAA", user());
					return user()?.email || "";
				},
				studentAttendances,
				setStudentAttendances,
				studentAttendancesByStatus,
				setStudentAttendancesByStatus,
				studentAttendanceStatus,
				setStudentAttendanceStatus,
				refetchStudentAttendances: () => getOnRefetchStudentAttendances()?.(),
				onRefetchStudentAttendances: (cb) =>
					onRefetchStudentAttendances(() => cb),
				selectedstats,
				setSelectedstats,
			}}
		>
			{props.children}
		</TrackingStudentContext.Provider>
	);
}
