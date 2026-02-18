import type { APIRoute } from "astro";
import {
	hashPassword,
	createSession,
	setSessionCookie,
	isEmailVerified,
	clearVerifiedEmail,
} from "../../../lib/auth";

const allowedRoles = ["author", "editor", "reviewer"] as const;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
	const formData = await request.formData();
	const email = (formData.get("email") as string || "").trim().toLowerCase();
	const name = (formData.get("name") as string || "").trim();
	const password = formData.get("password") as string || "";
	const password2 = formData.get("password2") as string || "";
	const role = formData.get("role") as string || "author";
	const affiliation = (formData.get("affiliation") as string || "").trim();
	const journalIdStr = formData.get("journal_id") as string || "";
	const journalId = journalIdStr ? Number.parseInt(journalIdStr, 10) : null;
	const code = (formData.get("code") as string || "").trim();

	if (!email || !name || !password || !code) {
		return redirect("/register?error=missing_fields");
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

	if ((role === "editor" || role === "reviewer") && (!journalId || Number.isNaN(journalId))) {
		return redirect("/register?error=missing_journal");
	}

	const env = locals.runtime?.env;
	if (!env?.DB) {
		return redirect("/register?error=service_unavailable");
	}

	try {
		const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
		if (existing) {
			return redirect("/register?error=email_taken");
		}

		const verified = await isEmailVerified({ kv: env.SESSIONS_KV, db: env.DB }, email);
		if (!verified) {
			return redirect("/register?error=code_invalid");
		}

		const passwordHash = await hashPassword(password);
		const result = await env.DB.prepare(`
			INSERT INTO users (email, password_hash, name, role, journal_id, verified, affiliation)
			VALUES (?, ?, ?, ?, ?, 1, ?)
		`).bind(email, passwordHash, name, role, journalId, affiliation || null).run();

		const userId = result.meta.last_row_id as number;
		await clearVerifiedEmail({ kv: env.SESSIONS_KV, db: env.DB }, email);

		const sessionData = {
			userId,
			email,
			name,
			role: role as "author" | "editor" | "reviewer",
			journalId,
		};

		const token = await createSession({ kv: env.SESSIONS_KV, db: env.DB }, sessionData);
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/${role}?welcome=1`,
				"Set-Cookie": setSessionCookie(token),
			},
		});
	} catch (err) {
		console.error("Register error:", err);
		return redirect("/register?error=server_error");
	}
};
