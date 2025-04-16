import { For } from "solid-js";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import type { Attendance } from "~/supabase-client";

export function AttendanceTable(props: { attendances: Attendance[] }) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Cours</TableHead>
					<TableHead>Statut</TableHead>
					<TableHead>Date</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				<For each={props.attendances}>
					{(attendance) => (
						<TableRow>
							<TableCell>{attendance.name}</TableCell>
							<TableCell>{attendance.status}</TableCell>
							<TableCell>
								{new Date(attendance.timestamp).toLocaleString()}
							</TableCell>
						</TableRow>
					)}
				</For>
			</TableBody>
		</Table>
	);
}
