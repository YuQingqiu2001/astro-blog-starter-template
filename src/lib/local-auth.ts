import type { UserRole } from "./types";

interface LocalUser {
	id: number;
	email: string;
	passwordHash: string;
	name: string;
	primaryRole: UserRole;
	roleJournals: Partial<Record<UserRole, number | null>>;
	affiliation: string | null;
	orcid: string | null;
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
	orcid: string | null;
}): LocalUser {
	const state = getState();
	const user: LocalUser = {
		id: state.nextUserId++,
		email: input.email,
		passwordHash: input.passwordHash,
		name: input.name,
		primaryRole: input.role,
		roleJournals: {
			[input.role]: input.journalId,
		},
		affiliation: input.affiliation,
		orcid: input.orcid,
		verified: 1,
	};
	state.users.set(user.email, user);
	return user;
}

export function addLocalRole(email: string, role: UserRole, journalId: number | null): boolean {
	const user = findLocalUserByEmail(email);
	if (!user) return false;
	user.roleJournals[role] = journalId;
	return true;
}

export function hasLocalRole(email: string, role: UserRole): boolean {
	const user = findLocalUserByEmail(email);
	if (!user) return false;
	return Object.prototype.hasOwnProperty.call(user.roleJournals, role);
}

export function getLocalJournalIdForRole(email: string, role: UserRole): number | null {
	const user = findLocalUserByEmail(email);
	if (!user) return null;
	return user.roleJournals[role] ?? null;
}
