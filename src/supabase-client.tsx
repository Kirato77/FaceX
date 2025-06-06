import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const storageBucket = "id-pictures";

export interface Course {
	course_id: number;
	course_name: string;
	late_time_interval: [number, number];
}

export interface Block {
	block_id: number;
	block_name: string;
	start_time: string;
	end_time: string;
}

export interface User {
	email: string;
	role: string;
	matricule: string;
	name: string;
	first_name: string;
}

export interface Attendance {
	name: string;
	status: string;
	timestamp: string;
	attendance_id: number;
}

export interface StudentAttendanceStatus {
	present: number;
	absent: number;
	retard: number;
}

export interface AttendanceForClassBlock {
	student_email: string;
	student_full_name: string;
	attendance_status: string;
	matricule: string;
	attendance_id: number;
}

export interface Group {
	id: number;
	name: string;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// REQUESTS
async function fetchData<T>(rpcName: string): Promise<T> {
	const { data, error } = await supabase.rpc(rpcName);
	if (error) {
		throw new Error(`Error fetching data for ${rpcName}: ${error.message}`);
	}
	return data;
}

export async function getCoursesByInstructorId(instructorEmail: string) {
	const { data, error } = await supabase.rpc("get_courses_by_instructor", {
		instructor_email: instructorEmail,
	});
	if (error) {
		throw new Error(
			`Error fetching data for get_courses_by_instructor: ${error.message}`,
		);
	}
	return data as Course[];
}

export async function getClassBlocksByCourseId(courseId: number) {
	const { data, error } = await supabase.rpc("get_blocks_by_course", {
		course_id: courseId,
	});
	if (error) {
		throw new Error(
			`Error fetching data for get_blocks_by_course: ${error.message}`,
		);
	}
	return data as Block[];
}

export async function getUserByEmail(email: string | undefined) {
	const { data, error } = await supabase.rpc("get_user_by_email", {
		user_email: email,
	});
	if (error) {
		throw new Error(
			`Error fetching data for get_user_by_email: ${error.message}`,
		);
	}
	return data as User;
}

export async function getAttendanceByEmail(email: string) {
	const { data, error } = await supabase.rpc("get_attendance_by_email", {
		user_email: email,
	});
	if (error) {
		throw new Error(
			`Error fetching data for get_attendance_by_email: ${error.message}`,
		);
	}
	return data as Attendance[];
}

export async function getAttendanceByStatus(email: string, status: string) {
	const { data, error } = await supabase.rpc("get_attendance_by_status", {
		user_email: email,
		etustatus: status,
	});
	if (error) {
		throw new Error(
			`Error fetching data for get_attendance_by_status: ${error.message}`,
		);
	}
	return data as Attendance[];
}

export async function getStudentAttenceStatus(email: string) {
	const { data, error } = await supabase.rpc("get_student_attendance_status", {
		etu_email: email,
	});
	if (error) {
		throw new Error(
			`Error fetching data for get_student_attendance_status: ${error.message}`,
		);
	}
	return data as StudentAttendanceStatus;
}

export async function getStudentStatsForCourse(
	course_id: number,
	student_email: string,
) {
	const { data, error } = await supabase.rpc("get_student_stats_for_course", {
		p_course_id: course_id,
		p_student_email: student_email,
	});
	if (error) {
		throw new Error(
			`Error fetching data for get_student_stats_for_course: ${error.message}`,
		);
	}
	return data;
}

export async function getAttendanceForClassBlock(class_block_id: number) {
	const { data, error } = await supabase.rpc("get_attendance_for_class_block", {
		p_block_id: class_block_id,
	});
	if (error) {
		throw new Error(
			`Error fetching data for get_attendance_for_class_block: ${error.message}`,
		);
	}
	return data as AttendanceForClassBlock[];
}

export async function updateAttendanceForClassBlock(
	student_email: string,
	class_block_id: number,
	status: string,
	mode: string,
) {
	const { data, error } = await supabase.rpc("update_attendance", {
		p_student_email: student_email,
		p_block_id: class_block_id,
		p_status: status,
		p_mode: mode,
	});
	if (error) {
		throw new Error(
			`Error fetching data for update_attendance: ${error.message}`,
		);
	}
	return data;
}

export async function updateLateTimeInterval(
	course_id: number,
	new_late_time_interval: number[],
) {
	const { data, error } = await supabase.rpc("update_late_time_interval", {
		course_id: course_id,
		new_late_time_interval: new_late_time_interval,
	});
	if (error) {
		throw new Error(
			`Error fetching data for update_late_time_interval: ${error.message}`,
		);
	}
	return data;
}

export function getPictureUrl(picturePath: string) {
	const { data } = supabase.storage
		.from(storageBucket)
		.getPublicUrl(picturePath);

	return data.publicUrl;
}

export async function getGroupsByCourse(course_id: number): Promise<Group[]> {
	const { data, error } = await supabase.rpc("get_lists_by_course", {
		course_id: course_id,
	});
	if (error) {
		throw new Error(
			`Error fetching data for get_lists_by_course: ${error.message}`,
		);
	}
	return data;
}

export async function getGroupsByList(group_id: number): Promise<User[][]> {
	const { data, error } = await supabase.rpc("get_groups_by_list", {
		list_id: group_id,
	});
	if (error) {
		throw new Error(
			`Error fetching data for get_groups_by_list: ${error.message}`,
		);
	}
	return data;
}

export async function addList(
	course_id: number,
	student_groups: string[][],
	list_name: string,
) {
	const { data, error } = await supabase.rpc("add_list", {
		course_id: course_id,
		student_groups: student_groups,
		list_name: list_name,
	});
	if (error) {
		throw new Error(`Error fetching data for add_list: ${error.message}`);
	}
	return data;
}
