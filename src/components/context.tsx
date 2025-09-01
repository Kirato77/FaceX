import {
	type ComponentProps,
	type FlowComponent,
	createContext,
	createResource,
	createSignal,
	useContext,
} from "solid-js";
import { showToast } from "~/components/ui/toast";
import { type User, getUserByEmail, supabase } from "~/supabase-client";

// Global signal for account deactivation
export const [isAccountDeactivated, setIsAccountDeactivated] =
	createSignal(false);

interface UserContextData {
	user: {
		(): User | undefined;
		state: "unresolved" | "pending" | "ready" | "refreshing" | "errored";
		loading: boolean;
		error: any;
		latest: User | undefined;
	};

	refetch: () => void;
}

const UserContext = createContext<UserContextData>();

export function UserContextProvider(props: ComponentProps<FlowComponent>) {
	const [user, { refetch }] = createResource<User | undefined>(async () => {
		const { data } = await supabase.auth.getUser();
		const userEmail = data?.user?.email;

		// Vérifier que l'utilisateur est connecté et a un email
		if (!userEmail) {
			return undefined;
		}

		try {
			const userData = await getUserByEmail(userEmail);

			// Vérifier si le compte est actif (avec vérification de sécurité)
			if (userData && userData.active === false) {
				// Afficher un toast d'information avant la déconnexion
				showToast({
					title: "Account Deactivated",
					description:
						"Your account has been deactivated by an administrator. You will be redirected to the login page.",
					variant: "destructive",
				});

				// Attendre un peu pour que l'utilisateur puisse voir le toast
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Déconnecter l'utilisateur si son compte est désactivé
				await supabase.auth.signOut();
				setIsAccountDeactivated(true);
				return undefined;
			}

			return userData;
		} catch (error) {
			console.error("Error fetching user data:", error);
			return undefined;
		}
	});

	return (
		<UserContext.Provider value={{ user, refetch }}>
			{props.children}
		</UserContext.Provider>
	);
}

export function useUserContext() {
	const context = useContext(UserContext);

	if (context === undefined) {
		throw new Error(
			"`useUserContext` must be used within the inside `UserContext.Provider`",
		);
	}

	return context;
}

export function getSessionEmail() {
	const context = useContext(UserContext);

	if (!context || !context.user()) {
		console.trace(
			"Utilisateur non authentifié ou contexte utilisateur non disponible.",
		);
		return "";
	}

	return context.user()?.email || "";
}
