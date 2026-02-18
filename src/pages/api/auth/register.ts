import type { APIRoute } from "astro";
import { hashPassword, createSession, setSessionCookie } from "../../../lib/auth";
import { createLocalUser, findLocalUserByEmail } from "../../../lib/local-auth";

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
	const captchaExpected = (formData.get("captcha_expected") as string || "").trim();
	const captchaAnswer = (formData.get("captcha_answer") as string || "").trim();

	if (!email || !name || !password || !captchaExpected || !captchaAnswer) {
		return redirect("/register?error=missing_fields");
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

	if ((role === "editor" || role === "reviewer") && (!journalId || Number.isNaN(journalId))) {
		return redirect("/register?error=missing_journal");
	}

	const env = locals.runtime?.env;

	try {
		const passwordHash = await hashPassword(password);
		let userId: number;

		if (env?.DB) {
			const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
			if (existing) {
				return redirect("/register?error=email_taken");
			}

			const result = await env.DB.prepare(`
				INSERT INTO users (email, password_hash, name, role, journal_id, verified, affiliation)
				VALUES (?, ?, ?, ?, ?, 1, ?)
			`).bind(email, passwordHash, name, role, journalId, affiliation || null).run();
			userId = result.meta.last_row_id as number;
		} else {
			const existing = findLocalUserByEmail(email);
			if (existing) {
				return redirect("/register?error=email_taken");
			}
			userId = createLocalUser({
				email,
				passwordHash,
				name,
				role: role as "author" | "editor" | "reviewer",
				journalId,
				affiliation: affiliation || null,
			}).id;
		}

		const token = await createSession({ kv: env?.SESSIONS_KV, db: env?.DB }, {
			userId,
			email,
			name,
			role: role as "author" | "editor" | "reviewer",
			journalId,
		});

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
