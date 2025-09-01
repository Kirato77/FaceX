import { For, Show, createEffect, createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import {
	TextField,
	TextFieldInput,
	TextFieldLabel,
} from "~/components/ui/text-field";
import { showToast } from "~/components/ui/toast";
import { supabase } from "~/supabase-client";
import IconAddLine from "~icons/ri/add-line";
import IconDeleteBinLine from "~icons/ri/delete-bin-line";
import IconEditLine from "~icons/ri/edit-line";

interface User {
	email: string;
	role: "student" | "admin" | "instructor";
	matricule: string;
	name: string;
	first_name: string;
	active: boolean;
}

export function UsersManagement() {
	const [users, setUsers] = createSignal<User[]>([]);
	const [loading, setLoading] = createSignal(true);
	const [openDialog, setOpenDialog] = createSignal(false);
	const [editingUser, setEditingUser] = createSignal<User | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
	const [userToDelete, setUserToDelete] = createSignal<User | null>(null);
	const [searchQuery, setSearchQuery] = createSignal("");
	const [formData, setFormData] = createSignal({
		email: "",
		role: "student" as "student" | "admin" | "instructor",
		matricule: "",
		name: "",
		first_name: "",
		active: true,
	});

	// Computed signal for filtered users
	const filteredUsers = () => {
		const query = searchQuery().toLowerCase();
		if (!query) return users();

		return users().filter(
			(user) =>
				(user.email?.toLowerCase() || "").includes(query) ||
				(user.name?.toLowerCase() || "").includes(query) ||
				(user.first_name?.toLowerCase() || "").includes(query) ||
				(user.matricule?.toLowerCase() || "").includes(query),
		);
	};

	// Fetch users on component mount
	createEffect(() => {
		fetchUsers();
	});

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("users")
				.select("*")
				.order("email");

			if (error) throw error;
			setUsers(data || []);
		} catch (error) {
			console.error("Error fetching users:", error);
			showToast({
				title: "Error",
				description: "Failed to fetch users",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async () => {
		try {
			if (editingUser()) {
				// Update existing user
				const { error } = await supabase
					.from("users")
					.update(formData())
					.eq("email", editingUser()!.email);

				if (error) throw error;
				showToast({
					title: "Success",
					description: "User updated successfully",
				});
			} else {
				// Create new user
				const { error } = await supabase.from("users").insert([formData()]);

				if (error) throw error;
				showToast({
					title: "Success",
					description: "User created successfully",
				});
			}

			setOpenDialog(false);
			resetForm();
			fetchUsers();
		} catch (error) {
			console.error("Error saving user:", error);
			showToast({
				title: "Error",
				description: "Failed to save user",
				variant: "destructive",
			});
		}
	};

	const handleEdit = (user: User) => {
		setEditingUser(user);
		setFormData({
			email: user.email,
			role: user.role,
			matricule: user.matricule,
			name: user.name,
			first_name: user.first_name,
			active: user.active,
		});
		setOpenDialog(true);
	};

	const handleDelete = async (user: User) => {
		setUserToDelete(user);
		setDeleteDialogOpen(true);
	};

	const handleReactivate = async (user: User) => {
		try {
			const { error } = await supabase
				.from("users")
				.update({ active: true })
				.eq("email", user.email);

			if (error) throw error;
			showToast({
				title: "Success",
				description: "User reactivated successfully",
			});
			fetchUsers();
		} catch (error) {
			console.error("Error reactivating user:", error);
			showToast({
				title: "Error",
				description: "Failed to reactivate user",
				variant: "destructive",
			});
		}
	};

	const confirmDelete = async () => {
		if (!userToDelete()) return;

		try {
			const { error } = await supabase
				.from("users")
				.update({ active: false })
				.eq("email", userToDelete()!.email);

			if (error) throw error;
			showToast({
				title: "Success",
				description: "User deactivated successfully",
			});
			fetchUsers();
		} catch (error) {
			console.error("Error deactivating user:", error);
			showToast({
				title: "Error",
				description: "Failed to deactivate user",
				variant: "destructive",
			});
		} finally {
			setDeleteDialogOpen(false);
			setUserToDelete(null);
		}
	};

	const resetForm = () => {
		setEditingUser(null);
		setFormData({
			email: "",
			role: "student",
			matricule: "",
			name: "",
			first_name: "",
			active: true,
		});
	};

	const openCreateDialog = () => {
		resetForm();
		setOpenDialog(true);
	};

	return (
		<div class="container mx-auto p-6">
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<h1 class="text-2xl sm:text-3xl font-bold">Users Management</h1>
				<Button onClick={openCreateDialog} class="gap-2 w-full sm:w-auto">
					<IconAddLine class="w-5 h-5" />
					Add User
				</Button>
			</div>

			<Show when={!loading()} fallback={<div>Loading users...</div>}>
				<Card>
					<CardHeader>
						<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
							<div>
								<CardTitle>Users List</CardTitle>
								<CardDescription>
									Manage all users in the system
								</CardDescription>
							</div>
							<TextField class="w-full sm:w-64">
								<TextFieldInput
									value={searchQuery()}
									onInput={(e) => setSearchQuery(e.currentTarget.value)}
									placeholder="Search by email, name, first name, or matricule..."
									class="w-full"
								/>
							</TextField>
						</div>
					</CardHeader>
					<CardContent class="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead class="min-w-[120px]">Email</TableHead>
									<TableHead class="min-w-[80px]">Role</TableHead>
									<TableHead class="min-w-[100px]">Matricule</TableHead>
									<TableHead class="min-w-[100px]">Name</TableHead>
									<TableHead class="min-w-[100px]">First Name</TableHead>
									<TableHead class="min-w-[80px]">Status</TableHead>
									<TableHead class="min-w-[120px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								<For each={filteredUsers()}>
									{(user) => (
										<TableRow class={user.active ? "" : "opacity-50"}>
											<TableCell class="font-medium break-all">
												{user.email}
											</TableCell>
											<TableCell>
												<span
													class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
														user.role === "admin"
															? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
															: user.role === "instructor"
																? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
																: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
													}`}
												>
													{user.role}
												</span>
											</TableCell>
											<TableCell class="break-all">{user.matricule}</TableCell>
											<TableCell class="break-all">{user.name}</TableCell>
											<TableCell class="break-all">{user.first_name}</TableCell>
											<TableCell>
												<span
													class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
														user.active
															? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
															: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
													}`}
												>
													{user.active ? "Active" : "Inactive"}
												</span>
											</TableCell>
											<TableCell>
												<div class="flex flex-col sm:flex-row gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleEdit(user)}
														class="gap-1 w-full sm:w-auto"
													>
														<IconEditLine class="w-4 h-4" />
														Edit
													</Button>
													{user.active ? (
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleDelete(user)}
															class="gap-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 w-full sm:w-auto"
														>
															<IconDeleteBinLine class="w-4 h-4" />
															Deactivate
														</Button>
													) : (
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleReactivate(user)}
															class="gap-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 w-full sm:w-auto"
														>
															<IconDeleteBinLine class="w-4 h-4" />
															Reactivate
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									)}
								</For>
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</Show>

			<Dialog open={openDialog()} onOpenChange={setOpenDialog}>
				<DialogContent class="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>
							{editingUser() ? "Edit User" : "Create User"}
						</DialogTitle>
						<DialogDescription>
							{editingUser()
								? "Make changes to the user here."
								: "Add a new user to the system."}
						</DialogDescription>
					</DialogHeader>
					<div class="grid gap-4 py-4">
						<TextField>
							<TextFieldLabel>Email</TextFieldLabel>
							<TextFieldInput
								value={formData().email}
								onInput={(e) =>
									setFormData((prev) => ({
										...prev,
										email: e.currentTarget.value,
									}))
								}
								disabled={!!editingUser()}
								placeholder="user@example.com"
							/>
						</TextField>
						<div class="flex flex-col gap-2">
							<Label class="text-sm font-medium">Role</Label>
							<select
								value={formData().role}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										role: e.currentTarget.value as
											| "student"
											| "instructor"
											| "admin",
									}))
								}
								class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<option value="student">Student</option>
								<option value="instructor">Instructor</option>
								<option value="admin">Admin</option>
							</select>
						</div>
						<TextField>
							<TextFieldLabel>Matricule</TextFieldLabel>
							<TextFieldInput
								value={formData().matricule}
								onInput={(e) =>
									setFormData((prev) => ({
										...prev,
										matricule: e.currentTarget.value,
									}))
								}
								placeholder="12345"
							/>
						</TextField>
						<TextField>
							<TextFieldLabel>Last Name</TextFieldLabel>
							<TextFieldInput
								value={formData().name}
								onInput={(e) =>
									setFormData((prev) => ({
										...prev,
										name: e.currentTarget.value,
									}))
								}
								placeholder="Doe"
							/>
						</TextField>
						<TextField>
							<TextFieldLabel>First Name</TextFieldLabel>
							<TextFieldInput
								value={formData().first_name}
								onInput={(e) =>
									setFormData((prev) => ({
										...prev,
										first_name: e.currentTarget.value,
									}))
								}
								placeholder="John"
							/>
						</TextField>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpenDialog(false)}>
							Cancel
						</Button>
						<Button onClick={handleSubmit}>
							{editingUser() ? "Update" : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Deactivation</DialogTitle>
						<DialogDescription>
							Are you sure you want to deactivate user "{userToDelete()?.email}
							"? The user will not be able to access the system until
							reactivated.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDelete}>
							Deactivate
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
