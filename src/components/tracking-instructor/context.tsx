import {
	type Accessor,
	type ParentProps,
	Setter,
	createContext,
	createMemo,
	createSignal,
	useContext,
} from "solid-js";
import { createStore, SetStoreFunction, StoreSetter } from "solid-js/store";
import {
	type AttendanceForClassBlock,
	type Block,
	type Course,
} from "~/supabase-client";

export interface TrackingInstructorContextValue {
	openEditCourseDialog: Accessor<boolean>;
	setOpenEditCourseDialog: (open: boolean) => void;
	openStudentDetailsDialog: Accessor<boolean>;
	setOpenStudentDetailsDialog: (
		student: AttendanceForClassBlock | undefined,
	) => void;
	courses: Course[];
  setCourses: SetStoreFunction<Course[]>;
	selectedCourse: Accessor<Course | undefined>;
	refetchCourses: () => void;
  onRefetchCourses: (callback: () => void) => void;
	blocks: Block[];
  setBlocks: SetStoreFunction<Block[]>;
	selectedBlock: Accessor<Block | undefined>;
	selectedCourseId: Accessor<number | undefined>;
	setSelectedCourseId: (id: number | undefined) => void;
	selectedBlockId: Accessor<number | undefined>;
	setSelectedBlockId: (id: number | undefined) => void;
	attendances: AttendanceForClassBlock[];
  setAttendances: SetStoreFunction<AttendanceForClassBlock[]>;
	refetchAttendances: () => void;
  onRefetchAttendances: (callback: () => void) => void;
	presentAttendances: () => AttendanceForClassBlock[];
	studentStats: Accessor<any>;
  setStudentStats: Setter<any>;
  onRefetchStudentStats: (callback: () => void) => void;
	selectedStudent: Accessor<AttendanceForClassBlock | undefined>;
}

export const TrackingInstructorContext =
	createContext<TrackingInstructorContextValue>();

export function useTrackingInstructorContext() {
	const context = useContext(TrackingInstructorContext);

	if (context === undefined) {
		throw new Error(
			"[FaceX]: `useTrackingInstructorContext` must be used within a `TrackingInstructorProvider` component",
		);
	}

	return context as TrackingInstructorContextValue;
}

export function TrackingInstructorProvider(props: ParentProps) {

	const [openEditCourseDialog, setOpenEditCourseDialog] = createSignal(false);
	const [openStudentDetailsDialog, setOpenStudentDetailsDialog] =
		createSignal(false);
	const [_selectedCourseId, setSelectedCourseId] = createSignal<number>();
	const [_selectedBlockId, setSelectedBlockId] = createSignal<number>();
	const [selectedStudent, setSelectedStudent] =
		createSignal<AttendanceForClassBlock>();

  const [courses, setCourses] = createStore<Course[]>([]);
  const [blocks, setBlocks] = createStore<Block[]>([]);
  const [attendances, setAttendances] = createStore<AttendanceForClassBlock[]>([]);
  const [studentStats, setStudentStats] = createSignal<any>(null);

  const [getOnRefetchCourses, onRefetchCourses] = createSignal<(() => void)>();
  const [getOnRefetchAttendances, onRefetchAttendances] = createSignal<(() => void)>(); 
  const [getOnRefetchStudentStats, onRefetchStudentStats] = createSignal<(() => void)>();

	const selectedCourseId = createMemo(() => {
		if (courses.length === 0) return undefined;
		return _selectedCourseId() ?? courses[0].course_id;
	});


	const selectedBlockId = createMemo(() => {
		if (blocks.length === 0) return undefined;
		return _selectedBlockId() ?? blocks[0].block_id;
	});

	const presentAttendances = () => {
		return attendances.filter(
			(a: { attendance_status: string }) =>
				a.attendance_status === "Present" || a.attendance_status === "Late",
		);
	};

	const selectedCourse = createMemo(() => {
		if (courses.length === 0) return undefined;
		return courses.find((c) => c.course_id === selectedCourseId());
	});

	const selectedBlock = createMemo(() => {
		if (blocks.length === 0) return undefined;
		return blocks.find((b) => b.block_id === selectedBlockId());
	});

	return (
		<TrackingInstructorContext.Provider
			value={{
				openEditCourseDialog,
				setOpenEditCourseDialog,
				courses,
				refetchCourses: () => getOnRefetchCourses()?.(),
				blocks,
				selectedCourseId,
				setSelectedCourseId,
				selectedBlockId,
				setSelectedBlockId,
				attendances,
				refetchAttendances: () => getOnRefetchAttendances()?.(),
				presentAttendances,
				studentStats,
				selectedCourse,
				selectedBlock,
				openStudentDetailsDialog,
				selectedStudent,
        onRefetchAttendances: (cb) => onRefetchAttendances(() => cb),
        onRefetchCourses: (cb) => onRefetchCourses(() => cb),
        onRefetchStudentStats: (cb) => onRefetchStudentStats(() => cb),
        setCourses,
        setBlocks,
        setAttendances,
        setStudentStats,
				setOpenStudentDetailsDialog: (
					student: AttendanceForClassBlock | undefined,
				) => {
					if (!student) {
						setOpenStudentDetailsDialog(false);
            setTimeout(() => {
              setSelectedStudent(undefined);
            }, 300);
						return;
					}
					setSelectedStudent(student);
					getOnRefetchStudentStats()?.();
					setOpenStudentDetailsDialog(true);
				},
			}}
		>
			{props.children}
		</TrackingInstructorContext.Provider>
	);
}
