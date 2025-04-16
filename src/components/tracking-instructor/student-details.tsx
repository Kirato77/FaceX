import { type Accessor, Show, createMemo, onCleanup } from "solid-js";
import type { JSX } from "solid-js";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { getPictureUrl } from "~/supabase-client";
import { useTrackingInstructorContext } from "./context";

export function StudentDetails() {
	const {
		openStudentDetailsDialog,
		setOpenStudentDetailsDialog,
		studentStats: _studentStats,
		selectedStudent,
	} = useTrackingInstructorContext();

	const studentStats: Accessor<{
		present_count: number | JSX.Element;
		late_count: number | JSX.Element;
		absent_count: number | JSX.Element;
	}> = createMemo(() => {
		if (!_studentStats || !_studentStats() || !_studentStats()[0])
			return {
				present_count: <Skeleton height={16} width={32} radius={4} />,
				late_count: <Skeleton height={16} width={32} radius={4} />,
				absent_count: <Skeleton height={16} width={32} radius={4} />,
			};
		return _studentStats()[0];
	});

	return (
		<Dialog
			open={openStudentDetailsDialog()}
			onOpenChange={() => setOpenStudentDetailsDialog(undefined)}
		>
			<DialogContent>
				<div class="flex items-start space-x-4">
					<Avatar class="w-32 h-32">
						<AvatarImage
							src={getPictureUrl(
								`students/${selectedStudent()?.matricule}.jpg`,
							)}
							class="object-cover w-32 h-32"
						/>
						<AvatarFallback>Photo</AvatarFallback>
					</Avatar>
					<div class="flex flex-col justify-center">
						<DialogHeader>
							<DialogTitle>{selectedStudent()?.student_full_name}</DialogTitle>
							<DialogDescription class="flex flex-col">
								<span>Matricule : {selectedStudent()?.matricule}</span>
								<span>Statut : {selectedStudent()?.attendance_status}</span>
								<Separator class="my-2" />
								<span>Total présences : {studentStats().present_count}</span>
								<span>Total retards : {studentStats().late_count}</span>
								<span>Total absences : {studentStats().absent_count}</span>
							</DialogDescription>
						</DialogHeader>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
