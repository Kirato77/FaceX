import {
	createMemo,
	createRenderEffect,
	createSignal,
} from "solid-js";
import { createStore } from "solid-js/store";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	NumberField,
	NumberFieldDecrementTrigger,
	NumberFieldGroup,
	NumberFieldIncrementTrigger,
	NumberFieldInput,
	NumberFieldLabel,
} from "~/components/ui/number-field";
import {
	TextField,
	TextFieldInput,
	TextFieldLabel,
} from "~/components/ui/text-field";
import { updateLateTimeInterval } from "~/supabase-client";
import IconRefreshLine from "~icons/ri/refresh-line";
import { useTrackingInstructorContext } from "./context";
import { showToast } from "~/components/ui/toast";

export function EditCourse() {
	const {
		openEditCourseDialog,
		setOpenEditCourseDialog,
		selectedCourse,
		refetchCourses,
		selectedBlock,
		courses,
	} = useTrackingInstructorContext();

	const [lateTime, setLateTime] = createStore({
		late: 0,
		absent: 0,
	});

	const [loading, setLoading] = createSignal(false);

	createRenderEffect(() => {
		setLateTime({
			late: selectedCourse()?.late_time_interval[0],
			absent: selectedCourse()?.late_time_interval[1],
		});
	});

	const blockDuration = createMemo(() => {
		const block = selectedBlock();
		if (!block) return 0;
		const endTime = new Date(block.end_time).getTime();
		const startTime = new Date(block.start_time).getTime();
		return (endTime - startTime) / (1000 * 60);
	});

	return (
		<Dialog
			open={openEditCourseDialog()}
			onOpenChange={setOpenEditCourseDialog}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle class="flex flex-row gap-2 items-center">
						Edit Course
						<Button
							variant="ghost"
							class="flex h-5 w-5 p-3"
							title="Refresh"
							onClick={() => {
								refetchCourses();
							}}
						>
							<IconRefreshLine class="h-5 w-5" />
						</Button>
					</DialogTitle>
					<DialogDescription>Changer les paramètres du cours</DialogDescription>
				</DialogHeader>
				<TextField class="flex flex-row items-center">
					<TextFieldLabel>Nom</TextFieldLabel>
					<TextFieldInput value={selectedCourse()?.course_name} disabled />
				</TextField>
				<NumberField
					class="flex flex-row items-center gap-2"
					rawValue={lateTime.late}
					onRawValueChange={(value) => setLateTime("late", value)}
					minValue={0}
					maxValue={lateTime.absent}
				>
					<NumberFieldLabel>Début du retard</NumberFieldLabel>
					<NumberFieldGroup>
						<NumberFieldInput />
						<NumberFieldIncrementTrigger />
						<NumberFieldDecrementTrigger />
					</NumberFieldGroup>
					<span>min</span>
				</NumberField>
				<NumberField
					class="flex flex-row items-center gap-2"
					rawValue={lateTime.absent}
					onRawValueChange={(value) => setLateTime("absent", value)}
					minValue={lateTime.late}
					maxValue={blockDuration()}
				>
					<NumberFieldLabel>Début d'absence</NumberFieldLabel>
					<NumberFieldGroup>
						<NumberFieldInput />
						<NumberFieldIncrementTrigger />
						<NumberFieldDecrementTrigger />
					</NumberFieldGroup>
					<span>min</span>
				</NumberField>
				<DialogFooter>
					<Button
						disabled={loading()}
						onClick={() => {
							if (!selectedCourse()) return;
							setLoading(true);
							updateLateTimeInterval(selectedCourse()!.course_id, [
								lateTime.late,
								lateTime.absent,
							]).then(() => {
								refetchCourses();
								setLoading(false);
								setOpenEditCourseDialog(false);
                showToast({
                  variant: "success",
                  title: "Cours mis à jour",
                  description: "Les paramètres du cours ont été mis à jour avec succès.",
                });
							});
						}}
					>
						Sauvegarder
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
