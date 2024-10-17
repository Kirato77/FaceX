import { useLocation } from "@solidjs/router";
import {
	IoCheckmarkCircleOutline,
	IoLogOutOutline,
	IoPersonCircleOutline,
} from "solid-icons/io";
import { RiMediaWebcamLine } from "solid-icons/ri";
import { createResource } from "solid-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu"
import {supabase} from "~/supabase-client";

export default function Navbar() {
	const [user, { refetch }] = createResource(
		async () => {
			return supabase.auth.getUser();
		},
	);
	const location = useLocation();

	return (
		<nav class="flex items-right justify-between p-4 bg-gray-100 shadow-md rounded-lg">
			<div class="flex items-center">
				<a href="/" class="flex flex-row font-bold text-lg">
					<RiMediaWebcamLine class="w-8 h-8 mr-1" />
					FaceX
				</a>
			</div>

			<div class="flex items-center space-x-6">
				{/*<div class="flex items-center group cursor-pointer">*/}
				{/*	<a*/}
				{/*		href="/roulette"*/}
				{/*		class={`flex flex-row ${location.pathname === "/roulette" ? "text-blue-500" : "group-hover:text-blue-500"}`}*/}
				{/*	>*/}
				{/*		<RiSystemTimer2Line class="w-6 h-6 mr-1" />*/}
				{/*		Roulette*/}
				{/*	</a>*/}
				{/*</div>*/}
				<div class="flex items-center group cursor-pointer">
					<a
						href="/tracking"
						class={`flex flex-row ${location.pathname === "/tracking" ? "text-blue-500" : "group-hover:text-blue-500"}`}
					>
						<IoCheckmarkCircleOutline class="w-6 h-6 mr-1" />
						Tracking
					</a>
				</div>
				{/*<div class="flex items-center group cursor-pointer">*/}
				{/*	<a*/}
				{/*		href="/group"*/}
				{/*		class={`flex flex-row ${location.pathname === "/group" ? "text-blue-500" : "group-hover:text-blue-500"}`}*/}
				{/*	>*/}
				{/*		<TiGroup class="w-6 h-6 mr-1" />*/}
				{/*		Groupe*/}
				{/*	</a>*/}
				{/*</div>*/}
				<div class="flex items-center group cursor-pointer">
					<DropdownMenu>
						<DropdownMenuTrigger class="flex flex-row group-hover:text-blue-500">
							<IoPersonCircleOutline class="w-6 h-6 mr-1" />
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>My Account</DropdownMenuLabel>
							<DropdownMenuLabel>{user()?.data?.user?.email}</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem class="!text-red-600" onSelect={() => supabase.auth.signOut()}>
								<IoLogOutOutline class="w-5 h-5 mr-1"/>
								Log out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</nav>
	);
}
