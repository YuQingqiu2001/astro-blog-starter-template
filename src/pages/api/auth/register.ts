import type { APIRoute } from "astro";
import { hashPassword, verifyPassword, createSession, setSessionCookie } from "../../../lib/auth";
import {
	createLocalUser,
	findLocalUserByEmail,
	addLocalRole,
	hasLocalRole,
	getLocalJournalIdForRole,
} from "../../../lib/local-auth";
import { getDb, getKv } from "../../../lib/runtime-env";

const allowedRoles = ["author", "editor", "reviewer"] as const;

async function isBoardMemberEmail(db: D1Database, email: string, journalId: number | null): Promise<boolean> {
	if (journalId) {
		const row = await db.prepare(`
			SELECT eb.user_id
			FROM editorial_board eb
			JOIN users u ON u.id = eb.user_id
			WHERE lower(u.email) = ? AND eb.journal_id = ?
			LIMIT 1
		`).bind(email, journalId).first();
		return Boolean(row);
	}

	const row = await db.prepare(`
		SELECT eb.user_id
		FROM editorial_board eb
		JOIN users u ON u.id = eb.user_id
		WHERE lower(u.email) = ?
		LIMIT 1
	`).bind(email).first();
	return Boolean(row);
}


function normalizeOrcid(orcidInput: string): string | null {
	if (!orcidInput) return null;
	const value = orcidInput.trim();
	if (!value) return null;
	const cleaned = value.replace(/^https?:\/\/orcid\.org\//i, "").trim();
	if (!/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i.test(cleaned)) return null;
	return cleaned.toUpperCase();
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
	const formData = await request.formData();
	const email = (formData.get("email") as string || "").trim().toLowerCase();
	const name = (formData.get("name") as string || "").trim();
	const password = formData.get("password") as string || "";
	const password2 = formData.get("password2") as string || "";
	const role = formData.get("role") as string || "author";
	const affiliation = (formData.get("affiliation") as string || "").trim();
	const orcid = normalizeOrcid((formData.get("orcid") as string || "").trim());
	const journalIdStr = formData.get("journal_id") as string || "";
	const journalId = journalIdStr ? Number.parseInt(journalIdStr, 10) : null;
	const captchaExpected = (formData.get("captcha_expected") as string || "").trim();
	const captchaAnswer = (formData.get("captcha_answer") as string || "").trim();

	if (!email || !name || !password || !captchaExpected || !captchaAnswer) {
		return redirect("/register?error=missing_fields");
	}

	if ((formData.get("orcid") as string || "").trim() && !orcid) {
		return redirect("/register?error=invalid_orcid");
	}

	if (captchaExpected !== captchaAnswer) {
		return redirect("/register?error=captcha_failed");
	}

	if (email.length > 254 || name.length > 120 || affiliation.length > 255) {
		return redirect("/register?error=invalid_input");
	}

	if (password.length < 8) {
		return redirect("/register?error=weak_password");
	}

	if (password !== password2) {
		return redirect("/register?error=password_mismatch");
	}

	if (!allowedRoles.includes(role as typeof allowedRoles[number])) {
		return redirect("/register?error=invalid_role");
	}

	if ((role === "editor" || role === "reviewer") && !journalId) {
		return redirect("/register?error=missing_journal");
	}

	const env = locals.runtime?.env;
	const db = getDb(env as any);
	const kv = getKv(env as any);
	const selectedRole = role as "author" | "editor" | "reviewer";

	try {
		if (db && selectedRole !== "author") {
			const canRegisterRole = await isBoardMemberEmail(db, email, journalId);
			if (!canRegisterRole) {
				return redirect("/register?error=not_board_member");
			}
		}

		const passwordHash = await hashPassword(password);
		let userId: number;
		let roleJournalId: number | null = journalId;

		if (db) {
			const existing = await db.prepare(
				"SELECT id, password_hash, name, affiliation, orcid FROM users WHERE email = ?"
			).bind(email).first() as {
				id: number;
				password_hash: string;
				name: string;
				affiliation: string | null;
				orcid: string | null;
			} | null;

			if (!existing) {
				const result = await db.prepare(`
					INSERT INTO users (email, password_hash, name, role, journal_id, verified, affiliation, orcid)
					VALUES (?, ?, ?, ?, ?, 1, ?, ?)
				`).bind(email, passwordHash, name, selectedRole, roleJournalId, affiliation || null, orcid).run();
				userId = result.meta.last_row_id as number;
			} else {
				const valid = await verifyPassword(password, existing.password_hash);
				if (!valid) {
					return redirect("/register?error=email_taken");
				}
				userId = existing.id;
				await db.prepare(`
					UPDATE users
					SET name = ?, affiliation = COALESCE(?, affiliation), orcid = COALESCE(?, orcid)
					WHERE id = ?
				`).bind(name, affiliation || null, orcid, userId).run();
			}

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

			await db.prepare(`
				INSERT OR IGNORE INTO user_roles (user_id, email, role, journal_id)
				VALUES (?, ?, ?, ?)
			`).bind(userId, email, selectedRole, roleJournalId).run();

			const roleRow = await db.prepare(
				"SELECT journal_id FROM user_roles WHERE user_id = ? AND role = ?"
			).bind(userId, selectedRole).first() as { journal_id: number | null } | null;
			if (roleRow) {
				roleJournalId = roleRow.journal_id;
			}
		} else {
			if (selectedRole !== "author") {
				return redirect("/register?error=service_unavailable");
			}
			const existing = findLocalUserByEmail(email);
			if (!existing) {
				userId = createLocalUser({
					email,
					passwordHash,
					name,
					role: selectedRole,
					journalId: roleJournalId,
					affiliation: affiliation || null,
					orcid,
				}).id;
			} else {
				const valid = await verifyPassword(password, existing.passwordHash);
				if (!valid) {
					return redirect("/register?error=email_taken");
				}
				userId = existing.id;
				if (!hasLocalRole(email, selectedRole)) {
					addLocalRole(email, selectedRole, roleJournalId);
				}
				roleJournalId = getLocalJournalIdForRole(email, selectedRole);
			}
		}

		const token = await createSession({ kv, db }, {
			userId,
			email,
			name,
			role: selectedRole,
			journalId: roleJournalId,
		});

		return new Response(null, {
			status: 302,
			headers: {
				Location: `/${selectedRole}?welcome=1`,
				"Set-Cookie": setSessionCookie(token),
			},
		});
	} catch (err) {
		console.error("Register error:", err);
		return redirect("/register?error=server_error");
	}
};
