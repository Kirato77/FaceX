import { saveAs } from "file-saver";
import {
	For,
	Show,
	Suspense,
	createEffect,
	createSignal,
	onCleanup,
	useTransition,
} from "solid-js";
import * as XLSX from "xlsx";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardFooter, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import IconCameraLine from "~icons/ri/camera-line";
import IconGroupFill from "~icons/ri/group-fill";
import IconRefreshLine from "~icons/ri/refresh-line";
import IconSettings3Line from "~icons/ri/settings-3-line";
import IconTimer2Line from "~icons/ri/timer-2-line";

import { Title } from "@solidjs/meta";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
	NumberField,
	NumberFieldDecrementTrigger,
	NumberFieldErrorMessage,
	NumberFieldGroup,
	NumberFieldIncrementTrigger,
	NumberFieldInput,
} from "~/components/ui/number-field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import SpinWheel from "~/components/wheel";
import {
	type AttendanceForClassBlock,
	type Block,
	type Course,
	type Group,
	addList,
	getPictureUrl,
	supabase,
	updateAttendanceForClassBlock,
} from "~/supabase-client";
import { TextField, TextFieldInput, TextFieldLabel } from "../ui/text-field";
import { showToast } from "../ui/toast";
import { AttendancesLoader } from "./attendances-loader";
import { BlockLoader } from "./block-loader";
import { useTrackingInstructorContext } from "./context";
import { CourseLoader } from "./course-loader";
import { EditCourse } from "./edit-course";
import { GroupsByListLoader } from "./groups-by-list-loader";
import { GroupsForCourseLoader } from "./groups-for-course-loader";
import { MobileAttendance } from "./mobile-attendance";
import { StudentDetails } from "./student-details";
import { StudentStatsLoader } from "./student-stats-loader";

export default function InstructorView() {
	const {
		setOpenEditCourseDialog,
		refetchAttendances,
		selectedBlockId,
		courses,
		setSelectedCourseId,
		blocks,
		setSelectedBlockId,
		selectedCourse,
		attendances,
		presentAttendances,
		selectedBlock,
		setOpenStudentDetailsDialog,
		setAttendances,
		groupsForCourse,
		setSelectedGroup,
		groupsByList,
		selectedGroup,
		refetchGroupsForCourse,
	} = useTrackingInstructorContext();

	// Handle real-time inserts, updates and deletes
	const handleAttendanceChange = (payload: any) => {
		if (payload.eventType === "DELETE") {
			setAttendances((state) => {
				return state.map((attendance) => {
					if (attendance.attendance_id === payload.old.attendance_id) {
						return {
							...attendance,
							attendance_status: "Absent",
						};
					}
					return attendance;
				});
			});
			return;
		}

		if (payload.new.block_id === selectedBlockId()) {
			refetchAttendances(); // Re-fetch the attendances data whenever a change is detected related to the selected class block
		}
	};

	// Subscribe to real-time updates
	const attendanceChannel = supabase
		.channel("attendance")
		.on(
			"postgres_changes",
			{ event: "INSERT", schema: "public", table: "attendance" },
			(payload) => handleAttendanceChange(payload),
		)
		.on(
			"postgres_changes",
			{ event: "UPDATE", schema: "public", table: "attendance" },
			(payload) => handleAttendanceChange(payload),
		)
		.on(
			"postgres_changes",
			{ event: "DELETE", schema: "public", table: "attendance" },
			(payload) => handleAttendanceChange(payload),
		)
		.subscribe();

	const [openWheelDialog, setOpenWheelDialog] = createSignal(false);
	const [showWheel, setShowWheel] = createSignal(true);

	const [openDialog, setOpenDialog] = createSignal(false);
	const [peoplePerGroup, setPeoplePerGroup] = createSignal(0);
	const [groups, setGroups] = createSignal<string[][]>();
	const [includeAbsents, setIncludeAbsents] = createSignal(false);

	const getDate = () =>
		new Date().toLocaleDateString("fr-FR", {
			day: "2-digit",
			month: "2-digit",
		});

	const [groupName, setGroupName] = createSignal(getDate());

	const createGroups = (
		peoplePerGroup: number,
		presentStudents: AttendanceForClassBlock[],
	) => {
		setSelectedGroup(undefined);
		setGroupName(getDate());

		const groups: string[][] = [];
		let start = 0;
		const presentStudentNames = presentStudents.map(
			(student) => student.student_full_name,
		);

		for (let i = 0; i < presentStudentNames.length - 1; i++) {
			const j =
				Math.floor(Math.random() * (presentStudentNames.length - i)) + i;
			[presentStudentNames[i], presentStudentNames[j]] = [
				presentStudentNames[j],
				presentStudentNames[i],
			];
		}

		while (start < presentStudentNames.length) {
			groups.push(presentStudentNames.slice(start, start + peoplePerGroup));
			start += peoplePerGroup;
		}
		return groups;
	};

	const exportGroupsToExcel = () => {
		let fileName = groupName();

		if (fileName?.endsWith(".xlsx")) {
			fileName = fileName.slice(0, -5);
		}

		if (fileName) {
			const workbook = XLSX.utils.book_new();
			const groupList = groups();

			if (!groupList || groupList.length === 0) {
				console.error("Il n'y a pas de groupes disponibles !");
				return;
			}

			const maxStudents = Math.max(...groupList.map((g) => g.length));
			const worksheetData = [];

			// Create header row with group numbers
			const header = [...groupList.map((_, i) => `Groupe ${i + 1}`)];
			worksheetData.push(header);

			// Create a row for each student position
			for (let studentIndex = 0; studentIndex < maxStudents; studentIndex++) {
				const row = [...groupList.map((group) => group[studentIndex] || "")];
				worksheetData.push(row);
			}

			const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
			XLSX.utils.book_append_sheet(workbook, worksheet, "Groupe");

			const excelBuffer = XLSX.write(workbook, {
				bookType: "xlsx",
				type: "array",
			});
			const data = new Blob([excelBuffer], {
				type: "application/octet-stream",
			});

			saveAs(data, `${fileName}.xlsx`);
		}
	};

	createEffect(() => {
		if (selectedGroup()) setGroupName(selectedGroup()!.name);
		if (groupsByList)
			setGroups(
				groupsByList.map((group) =>
					group.map((user) => `${user.name.toUpperCase()} ${user.first_name}`),
				),
			);
	});

	// Clean up subscription when the component is destroyed
	onCleanup(() => {
		attendanceChannel.unsubscribe();
	});

	const [groupsLoading, setGroupsLoading] = createSignal(false);
	const [openMobileAttendance, setOpenMobileAttendance] = createSignal(false);

	return (
		<div class="flex flex-col p-5">
			<Suspense>
				<CourseLoader />
				<BlockLoader />
				<AttendancesLoader />
				<StudentStatsLoader />
				<GroupsForCourseLoader />
				<GroupsByListLoader />
			</Suspense>

			<Title>FaceX - Tracking</Title>
			<div class="flex flex-wrap justify-between gap-2">
				<div class="flex flex-wrap gap-2">
					<Select
						options={courses}
						value={selectedCourse()}
						onChange={(course) => {
							if (course) {
								setSelectedCourseId(course.course_id);
							}
						}}
						optionValue="course_id"
						optionTextValue="course_name"
						placeholder="Select a course"
						itemComponent={(props) => (
							<SelectItem item={props.item}>{props.item.textValue}</SelectItem>
						)}
					>
						<SelectTrigger aria-label="Course" class="w-[180px]">
							<SelectValue<Course>>
								{(state) => state.selectedOption()?.course_name}
							</SelectValue>
						</SelectTrigger>
						<SelectContent />
					</Select>
					<Select
						options={blocks}
						value={blocks.find((block) => block.block_id === selectedBlockId())}
						onChange={(block) => {
							if (block) {
								setSelectedBlockId(block.block_id);
							}
						}}
						optionValue="block_id"
						optionTextValue="block_name"
						placeholder="Select a class block"
						itemComponent={(props) => (
							<SelectItem item={props.item}>{props.item.textValue}</SelectItem>
						)}
					>
						<SelectTrigger aria-label="Block" class="w-[180px]">
							<SelectValue<Block>>
								{(state) => state.selectedOption()?.block_name}
							</SelectValue>
						</SelectTrigger>
						<SelectContent />
					</Select>
					<Button onClick={() => setOpenEditCourseDialog(true)} class="gap-1">
						<IconSettings3Line class="h-5 w-5" />
						Edit course
					</Button>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button onClick={() => setOpenMobileAttendance(true)} class="gap-1">
						<IconCameraLine class="h-5 w-5" />
						Take Attendance
					</Button>
					<Button onClick={() => setOpenWheelDialog(true)} class="gap-1">
						<IconTimer2Line class="h-5 w-5" />
						Spin wheel
					</Button>
					<Dialog open={openWheelDialog()} onOpenChange={setOpenWheelDialog}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle class="flex flex-row gap-2 items-center">
									Tourner la roue
									<Button
										variant="ghost"
										class="flex h-5 w-5 p-3"
										title="Refresh"
										onClick={() => {
											if (attendances.length > 0) {
												setShowWheel(false);
												setShowWheel(true);
											}
										}}
									>
										<IconRefreshLine class="h-5 w-5 text-white" />
									</Button>
								</DialogTitle>
								<DialogDescription>
									Cliquez sur la roue pour la faire tourner
								</DialogDescription>
							</DialogHeader>
							<Show when={showWheel()} keyed>
								<SpinWheel attendances={attendances} />
							</Show>
						</DialogContent>
					</Dialog>
					<Button onClick={() => setOpenDialog(true)} class="gap-1">
						<IconGroupFill class="h-5 w-5" />
						Compose groups
					</Button>
					<Dialog open={openDialog()} onOpenChange={setOpenDialog}>
						<DialogContent class="h-[75vh] w-[60vw] max-h-screen max-w-screen flex flex-col gap-4">
							<DialogHeader>
								<DialogTitle>Création de groupes</DialogTitle>
								<DialogDescription>
									Entrez le nombre de personnes par groupe :
								</DialogDescription>
							</DialogHeader>

							<div class="flex flex-col gap-4">
								<div class="flex items-start gap-2">
									<div class="relative">
										<NumberField
											defaultValue={2}
											minValue={1}
											onRawValueChange={(value) => {
												setPeoplePerGroup(value);
												setGroups(
													createGroups(
														value,
														includeAbsents()
															? attendances
															: attendances.filter(
																	(a: { attendance_status: string }) =>
																		a.attendance_status === "Present" ||
																		a.attendance_status === "Late",
																),
													),
												);
											}}
											validationState={
												peoplePerGroup() <= 0 ? "invalid" : "valid"
											}
											class="w-36"
										>
											<NumberFieldGroup>
												<NumberFieldInput />
												<NumberFieldIncrementTrigger />
												<NumberFieldDecrementTrigger />
											</NumberFieldGroup>
											<NumberFieldErrorMessage>
												Veuillez entrer un nombre valide de personnes par
												groupe.
											</NumberFieldErrorMessage>
										</NumberField>
									</div>

									<div class="flex items-center self-start">
										<Button
											variant="outline"
											class="w-10 h-10 flex items-center justify-center p-0"
											title="Refresh"
											onClick={() => {
												const filteredStudents = includeAbsents()
													? attendances
													: attendances.filter(
															(a: { attendance_status: string }) =>
																a.attendance_status === "Present" ||
																a.attendance_status === "Late",
														);

												const newGroups = createGroups(
													peoplePerGroup(),
													filteredStudents,
												);
												setGroups(newGroups);
												setOpenDialog(true);
											}}
										>
											<IconRefreshLine class="h-5 w-5" />
										</Button>
									</div>

									<Select
										options={groupsForCourse}
										value={selectedGroup() ?? null}
										onChange={(group) => {
											if (group) {
												setSelectedGroup(group);
											}
										}}
										optionValue="id"
										optionTextValue="name"
										placeholder="Load previous group"
										itemComponent={(props) => (
											<SelectItem item={props.item}>
												{props.item.textValue}
											</SelectItem>
										)}
									>
										<SelectTrigger aria-label="Course" class="w-[180px]">
											<SelectValue<Group>>
												{(state) => state.selectedOption()?.name}
											</SelectValue>
										</SelectTrigger>
										<SelectContent />
									</Select>
								</div>

								<div class="flex items-start space-x-2">
									<Checkbox
										id="include-absents"
										checked={includeAbsents()}
										onChange={(value) => {
											setIncludeAbsents(value);
											setGroups(
												createGroups(
													peoplePerGroup(),
													value === true
														? attendances
														: attendances.filter(
																(a: { attendance_status: string }) =>
																	a.attendance_status === "Present" ||
																	a.attendance_status === "Late",
															),
												),
											);
										}}
									/>
									<div class="grid gap-1.5 leading-none">
										<Label for="include-absents-input">
											Inclure les absents
										</Label>
									</div>
								</div>
							</div>

							<Show when={peoplePerGroup() > 0}>
								<div class="mt-4 max-w-full overflow-x-auto flex flex-wrap ">
									<For each={groups()}>
										{(group, groupIndex) => (
											<div class="flex items-start gap-4 flex-wrap w-full">
												<div class="flex-shrink-0 flex flex-col justify-center items-center w-32 h-20 bg-blue-500 text-white font-bold rounded overflow-hidden mt-4">
													Groupe {groupIndex() + 1}
												</div>
												<div class="flex flex-wrap gap-2">
													<For each={group}>
														{(studentName) => {
															const student = attendances.find(
																(a: { student_full_name: string }) =>
																	a.student_full_name === studentName,
															);

															return (
																<div class="flex flex-col items-center border rounded-lg w-32 px-2 py-2 mt-4">
																	<Avatar class="w-20 h-20 mb-1">
																		<AvatarImage
																			src={getPictureUrl(
																				`students/${student?.matricule}.jpg`,
																			)}
																			class="object-cover w-20 h-20"
																		/>
																		<AvatarFallback>Photo</AvatarFallback>
																	</Avatar>
																	<div class="text-base text-center truncate">
																		<For each={studentName.split(" ")}>
																			{(name) => <div>{name}</div>}
																		</For>
																	</div>
																</div>
															);
														}}
													</For>
												</div>
											</div>
										)}
									</For>
								</div>
							</Show>
							<DialogFooter>
								<TextField
									value={groupName()}
									onChange={(name) => setGroupName(name)}
									class="flex flex-row items-center"
								>
									<TextFieldLabel>Nom du groupe</TextFieldLabel>
									<TextFieldInput />
								</TextField>
								<Button
									variant="outline"
									onClick={() => {
										if (!selectedCourse() || !groups()) return;
										setGroupsLoading(true);
										addList(
											selectedCourse()!.course_id,
											groups()!.map((group) =>
												group.map(
													(student) =>
														attendances.find(
															(attendance) =>
																attendance.student_full_name === student,
														)!.student_email,
												),
											),
											groupName(),
										).then(() => {
											refetchGroupsForCourse();
											setGroupsLoading(false);

											showToast({
												variant: "success",
												title: "Groupes sauvegardés",
												description:
													"Les groupes ont été sauvegardés avec succès.",
											});
										});
									}}
									disabled={groupsLoading()}
									class="bg-black text-white font-bold rounded-lg hover:bg-gray-900"
								>
									Sauvegarder les groupes
								</Button>
								<Button
									variant="outline"
									onClick={exportGroupsToExcel}
									class="bg-black text-white font-bold rounded-lg hover:bg-gray-900"
								>
									Exporter les groupes
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>
			<div class="flex justify-center m-2">
				<Show
					when={attendances && attendances.length !== 0}
					fallback={"No Data"}
				>
					<div class="flex flex-col">
						<div class="flex justify-center items-center">
							<span class="flex flex-wrap gap-2 text-lg font-semibold">
								<span>Nombre d'étudiants présents:</span>
								<span>
									<span
										class={
											presentAttendances().length > 0
												? "text-green-600"
												: "text-red-600"
										}
									>
										{presentAttendances().length}
									</span>
									<span class="text-gray-500"> / {attendances.length}</span>
								</span>
							</span>
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 m-5 gap-5 max-w-screen-2xl">
							<For each={attendances}>
								{(attendance) => (
									<Card
										as={Button}
										class="flex flex-col justify-center items-center space-y-3 p-2 min-w-fit cursor-pointer"
										tabindex="0"
										aria-label={attendance.student_full_name}
										onClick={(e) => {
											setOpenStudentDetailsDialog(attendance);
										}}
									>
										<Avatar class="w-28 h-28 cursor-pointer">
											<AvatarImage
												src={getPictureUrl(
													`students/${attendance.matricule}.jpg`,
												)}
												class="object-cover w-28 h-28"
											/>
											<AvatarFallback>Photo</AvatarFallback>
										</Avatar>
										<CardTitle>{attendance.student_full_name}</CardTitle>
										<CardFooter>
											<Badge
												as={Button}
												onClick={(e) => {
													if (selectedBlock()?.block_id) {
														updateAttendanceForClassBlock(
															attendance.student_email,
															selectedBlock()!.block_id,
															attendance.attendance_status === "Present" ||
																attendance.attendance_status === "Late"
																? "Absent"
																: "Present",
															"manual",
														);

														e.preventDefault();
														e.stopPropagation();
													}
												}}
												class={`${attendance.attendance_status === "Present" ? "bg-green-600 text-white hover:bg-green-800" : attendance.attendance_status === "Late" ? "bg-green-600 text-white hover:bg-green-800 border-4 border-yellow-400" : ""} {} cursor-pointer`}
												variant={
													attendance.attendance_status === "Present" ||
													attendance.attendance_status === "Late"
														? "default"
														: "destructive"
												}
											>
												{attendance.attendance_status === "Late"
													? "Present"
													: attendance.attendance_status}
											</Badge>
										</CardFooter>
									</Card>
								)}
							</For>
						</div>
					</div>
				</Show>
			</div>

			<EditCourse />
			<StudentDetails />
			<MobileAttendance
				isOpen={openMobileAttendance()}
				onClose={() => setOpenMobileAttendance(false)}
				blockId={selectedBlockId()!.toString()}
			/>
		</div>
	);
}
