import { Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { Wheel } from "spin-wheel";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import wheelOverlay from "~/components/wheelv2-overlay.svg";
import type { Attendance } from "~/supabase-client";
import type { AttendanceForClassBlock } from "~/supabase-client";

interface SpinWheelProps {
	attendances: AttendanceForClassBlock[];
}

const overlayImage = document.createElement("img");
overlayImage.src = wheelOverlay;
overlayImage.style.objectFit = "cover";
overlayImage.style.position = "absolute";
overlayImage.style.top = "0";

const SpinWheel = (props: SpinWheelProps) => {
	const [winner, setWinner] = createSignal<string>();
	const [lastWinner, setLastWinner] = createSignal<string>();
	const [checkedIncludeAbsents, setCheckedIncludeAbsents] = createSignal(false);
	const [checkedRemoveStudent, setCheckedRemoveStudent] = createSignal(true);
	const [announce, setAnnounce] = createSignal(false);
	const [items, setItems] = createSignal({
		items: props.attendances
			.filter(
				(a: { attendance_status: string }) =>
					a.attendance_status === "Present" || a.attendance_status === "Late",
			)
			.map((attendance: AttendanceForClassBlock) => ({
				label: attendance.student_full_name,
			})),
	});

	let interactive = true;

	const [container, setContainer] = createSignal<HTMLDivElement>();
	const wheel = createMemo(() => {
		if (!container()) {
			return;
		}

		container()!.innerHTML = "";

		interactive = true;

		const wheel = new Wheel(container(), items());
		wheel.isInteractive = false;

		wheel.overlayImage = overlayImage;
		wheel.rotationSpeedMax = 1000;
		wheel.onRest = handleRest;
		wheel.onCurrentIndexChange = handleWinnerChange;
		wheel.itemBackgroundColors = ["#d2d7db", "#f2f4f7"];

		wheel.radius = 0.905;

		return wheel;
	});

	const handleWinnerChange = (e: { currentIndex: number }) => {
		setWinner(wheel().items[e.currentIndex].label);
	};

	onCleanup(() => {
		wheel()?.remove();
	});

	function getRandomInt(max: number) {
		return Math.floor(Math.random() * max);
	}

	const handleClick = () => {
		if (!interactive) {
			return;
		}

		if (wheel()) {
			interactive = false;
			setAnnounce(false);

			if (
				checkedRemoveStudent() &&
				lastWinner() !== undefined &&
				wheel().items.length > 1
			) {
				wheel().items.splice(lastWinner(), 1);
			}
			if (wheel().items.length === 1) {
				handleWinnerChange({ currentIndex: 0 });
			}
			wheel().spinToItem(getRandomInt(wheel().items.length), 4000, true, 5, 1);
		}
	};

	const handleRest = () => {
		interactive = true;
		setLastWinner(
			wheel().items.findIndex(
				(obj: { label: string }) => obj.label === winner(),
			),
		);
		setAnnounce(true);
	};

	return (
		<>
			<div class="flex items-start space-x-2">
				<Checkbox
					id="include-absents"
					checked={checkedIncludeAbsents()}
					onChange={(value) => {
						setCheckedIncludeAbsents(value);
						setItems(
							value === true
								? {
										items: props.attendances.map((attendance) => ({
											label: attendance.student_full_name,
										})),
									}
								: {
										items: props.attendances
											.filter(
												(a: { attendance_status: string }) =>
													a.attendance_status === "Present" ||
													a.attendance_status === "Late",
											)
											.map((attendance) => ({
												label: attendance.student_full_name,
											})),
									},
						);
					}}
				/>
				<div class="grid gap-1.5 leading-none">
					<Label for="include-absents-input">
						Inclure les étudiants absents
					</Label>
				</div>
			</div>
			<div class="flex items-start space-x-2">
				<Checkbox
					id="remove-student"
					checked={checkedRemoveStudent()}
					onChange={(value) => {
						setCheckedRemoveStudent(value);
					}}
				/>
				<div class="grid gap-1.5 leading-none">
					<Label for="remove-student-input">
						Retirer l'étudiant sélectionné
					</Label>
				</div>
			</div>
			<button
				type="button"
				class="wheel-container h-96 cursor-pointer"
				ref={setContainer}
				aria-label="Roue de tirage au sort."
				onClick={handleClick}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						handleClick();
					}
				}}
			>
				{/* The wheel will be rendered inside this */}
			</button>
			<Show when={winner()}>
				<div role={announce() ? "alert" : "none"}>
					L'étudiant sélectionné est : <strong>{winner()}</strong> !
				</div>
				<div
					id="announcement"
					aria-live="assertive"
					class="absolute -left-[9999px]"
				/>
			</Show>
		</>
	);
};

export default SpinWheel;
