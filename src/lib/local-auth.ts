import type { UserRole } from "./types";

interface LocalUser {
	id: number;
	email: string;
	passwordHash: string;
	name: string;
	role: UserRole;
	journalId: number | null;
	affiliation: string | null;
	verified: 0 | 1;
}

interface LocalAuthState {
	users: Map<string, LocalUser>;
	nextUserId: number;
}

const globalKey = "__RPG_LOCAL_AUTH_STATE__";

function getState(): LocalAuthState {
	const g = globalThis as unknown as Record<string, LocalAuthState | undefined>;
	if (!g[globalKey]) {
		g[globalKey] = {
			users: new Map(),
			nextUserId: 1,
		};
	}
	return g[globalKey]!;
}

export function findLocalUserByEmail(email: string): LocalUser | null {
	return getState().users.get(email) || null;
}

export function createLocalUser(input: {
	email: string;
	passwordHash: string;
	name: string;
	role: UserRole;
	journalId: number | null;
	affiliation: string | null;
}): LocalUser {
	const state = getState();
	const user: LocalUser = {
		id: state.nextUserId++,
		email: input.email,
		passwordHash: input.passwordHash,
		name: input.name,
		role: input.role,
		journalId: input.journalId,
		affiliation: input.affiliation,
		verified: 1,
	};
	state.users.set(user.email, user);
	return user;
}
