import {
	Suspense,
	createSignal,
	getOwner,
	onCleanup,
	runWithOwner,
} from "solid-js";
import { getSessionEmail } from "~/components/context";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { supabase } from "~/supabase-client";
import { AttendanceTable } from "./attendance-table";
import AttendancesByStatusLoader from "./attendances-by-status-loader";
import AttendancesLoader from "./attendances-loader";
import AttendancesStatusLoader from "./attendances-status-loader";
import { useTrackingStudentContext } from "./context";

export default function StudentView() {
	const studentEmail = getSessionEmail;

	const {
		studentAttendances,
		studentAttendancesByStatus,
		studentAttendanceStatus,
		selectedstats,
		setSelectedstats,
		refetchStudentAttendances,
	} = useTrackingStudentContext();

	const [open, setOpen] = createSignal(false);

	const handleAttendanceChange = (payload: any) => {
		if (payload.eventType === "DELETE") {
			if (
				studentAttendances.findIndex(
					(attendance) =>
						attendance.attendance_id === payload.old.attendance_id,
				)
			) {
				refetchStudentAttendances();
			}
			return;
		}

		if (payload.new.student_email === studentEmail()) {
			refetchStudentAttendances();
		}
	};

	const owner = getOwner();

	// Subscribe to real-time updates
	const attendanceChannel = supabase
		.channel("attendance")
		.on(
			"postgres_changes",
			{ event: "INSERT", schema: "public", table: "attendance" },
			(payload) => runWithOwner(owner, () => handleAttendanceChange(payload)),
		)
		.on(
			"postgres_changes",
			{ event: "UPDATE", schema: "public", table: "attendance" },
			(payload) => runWithOwner(owner, () => handleAttendanceChange(payload)),
		)
		.on(
			"postgres_changes",
			{ event: "DELETE", schema: "public", table: "attendance" },
			(payload) => runWithOwner(owner, () => handleAttendanceChange(payload)),
		)
		.subscribe();

	// Clean up subscription when the component is destroyed
	onCleanup(() => {
		attendanceChannel.unsubscribe();
	});

	// Affiche la liste des présences
	return (
		<div>
			<Suspense>
				<AttendancesLoader />
				<AttendancesStatusLoader />
				<AttendancesByStatusLoader />
			</Suspense>

			{/* Carte des statistiques */}
			<div
				class="m-6 p-4 max-w-md mx-auto"
				aria-label="Statistiques des présences de l'étudiant"
			>
				<ul class="space-y-4">
					{/* Présences */}
					<li class="flex items-center justify-between">
						<span>Nombre de présences :</span>
						{studentAttendanceStatus?.present}
						<Button
							onClick={() => {
								setSelectedstats("Present");
								setOpen(true);
							}}
							type="button"
							aria-label="Voir les détails des présences"
							variant="outline"
						>
							Détails
						</Button>
					</li>
					{/* Absences */}
					<li class="flex items-center justify-between">
						<span>Nombre d'absences :</span>
						{studentAttendanceStatus?.absent}
						<Button
							onClick={() => {
								setSelectedstats("Absent");
								setOpen(true);
							}}
							type="button"
							aria-label="Voir les détails des absences"
							variant="outline"
						>
							Détails
						</Button>
					</li>
					{/* Retards */}
					<li class="flex items-center justify-between">
						<span>Nombre de retards :</span>
						{studentAttendanceStatus?.retard}
						<Button
							onClick={() => {
								setSelectedstats("Retard");
								setOpen(true);
							}}
							type="button"
							aria-label="Voir les détails des retards"
							variant="outline"
						>
							Détails
						</Button>
					</li>
				</ul>
			</div>

			{/* Section des présences individuelles */}
			<div class="p-4" aria-label="Liste des présences">
				<h2 class="text-xl font-bold text-center mb-4">Mes présences</h2>
				<div class="flex flex-wrap gap-4" aria-live="polite">
					<AttendanceTable attendances={studentAttendances} />
				</div>
			</div>

			{/* Dialog des détails par statut */}
			<Dialog
				open={open()}
				onOpenChange={setOpen}
				aria-label={`Détails des ${selectedstats}`}
			>
				<DialogContent>
					<div class="flex flex-wrap gap-4" aria-live="polite">
						<AttendanceTable attendances={studentAttendancesByStatus} />
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
