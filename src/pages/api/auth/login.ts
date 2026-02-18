import type { APIRoute } from "astro";
import { verifyPassword, createSession, setSessionCookie } from "../../../lib/auth";
import { findLocalUserByEmail, hasLocalRole, getLocalJournalIdForRole } from "../../../lib/local-auth";
import { getDb, getKv } from "../../../lib/runtime-env";

function normalizeRedirectPath(input: string): string {
	if (!input || !input.startsWith("/") || input.startsWith("//")) {
		return "";
	}
	return input;
}

const allowedRoles = ["author", "editor", "reviewer"] as const;

interface LoginUserRow {
	id: number;
	email: string;
	password_hash: string;
	name: string;
	journal_id: number | null;
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
	const formData = await request.formData();
	const email = (formData.get("email") as string || "").trim().toLowerCase();
	const password = formData.get("password") as string || "";
	const selectedRole = (formData.get("role") as string || "author").trim() as "author" | "editor" | "reviewer";
	const captchaExpected = (formData.get("captcha_expected") as string || "").trim();
	const captchaAnswer = (formData.get("captcha_answer") as string || "").trim();
	const redirectTo = normalizeRedirectPath((formData.get("redirect") as string || "").trim());

	if (!email || !password || !captchaExpected || !captchaAnswer) {
		return redirect("/login?error=invalid");
	}

	if (captchaExpected !== captchaAnswer) {
		return redirect("/login?error=captcha_failed");
	}

	if (!allowedRoles.includes(selectedRole)) {
		return redirect("/login?error=invalid");
	}

	if (email.length > 254) {
		return redirect("/login?error=invalid");
	}

	const env = locals.runtime?.env;
	const db = getDb(env as any);
	const kv = getKv(env as any);

	try {
		let user: LoginUserRow | null = null;
		let roleJournalId: number | null = null;

		if (db) {
			user = await db.prepare(
				"SELECT id, email, password_hash, name FROM users WHERE email = ? AND verified = 1"
			).bind(email).first() as LoginUserRow | null;

			if (user) {
				await db.prepare(`
					CREATE TABLE IF NOT EXISTS user_roles (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						user_id INTEGER NOT NULL,
						email TEXT NOT NULL,
						role TEXT NOT NULL CHECK(role IN ('author', 'editor', 'reviewer')),
						journal_id INTEGER,
						created_at TEXT DEFAULT (datetime('now')),
						UNIQUE(user_id, role),
						FOREIGN KEY(user_id) REFERENCES users(id)
					)
				`).run();

				const roleRow = await db.prepare(
					"SELECT journal_id FROM user_roles WHERE user_id = ? AND role = ?"
				).bind(user.id, selectedRole).first() as { journal_id: number | null } | null;

				if (!roleRow) {
					return redirect("/login?error=role_missing");
				}
				roleJournalId = roleRow.journal_id;
			}
		} else {
			const local = findLocalUserByEmail(email);
			if (local && local.verified === 1) {
				if (!hasLocalRole(email, selectedRole)) {
					return redirect("/login?error=role_missing");
				}
				user = {
					id: local.id,
					email: local.email,
					password_hash: local.passwordHash,
					name: local.name,
					journal_id: getLocalJournalIdForRole(email, selectedRole),
				};
				roleJournalId = user.journal_id;
			}
		}

		if (!user) {
			return redirect("/login?error=invalid");
		}

		const valid = await verifyPassword(password, user.password_hash);
		if (!valid) {
			return redirect("/login?error=invalid");
		}

		const token = await createSession({ kv, db }, {
			userId: user.id,
			email: user.email,
			name: user.name,
			role: selectedRole,
			journalId: roleJournalId,
		});

		const dest = redirectTo || `/${selectedRole}`;
		return new Response(null, {
			status: 302,
			headers: {
				Location: dest,
				"Set-Cookie": setSessionCookie(token),
			},
		});
	} catch (err) {
		console.error("Login error:", err);
		return redirect("/login?error=unavailable");
	}
};
