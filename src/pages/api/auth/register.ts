import type { APIRoute } from "astro";
import { hashPassword, createSession, setSessionCookie } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, locals, redirect }) => {
	const formData = await request.formData();
	const email = (formData.get("email") as string || "").trim().toLowerCase();
	const name = (formData.get("name") as string || "").trim();
	const password = (formData.get("password") as string || "");
	const password2 = (formData.get("password2") as string || "");
	const role = formData.get("role") as string || "author";
	const affiliation = (formData.get("affiliation") as string || "").trim();
	const journalIdStr = formData.get("journal_id") as string || "";
	const journalId = journalIdStr ? parseInt(journalIdStr) : null;
	const code = (formData.get("code") as string || "").trim();

	if (!email || !name || !password || !code) {
		return redirect("/register?error=missing_fields");
	}

	if (password.length < 8) {
		return redirect("/register?error=weak_password");
	}

	if (password !== password2) {
		return redirect("/register?error=密码不匹配");
	}

	if (!["author", "editor", "reviewer"].includes(role)) {
		return redirect("/register?error=missing_fields");
	}

	const env = locals.runtime?.env;
	if (!env?.DB || !env?.SESSIONS_KV) {
		return redirect("/register?error=服务暂时不可用");
	}

	try {
		// Check if email already exists
		const existing = await env.DB.prepare(
			"SELECT id FROM users WHERE email = ?"
		).bind(email).first();

		if (existing) {
			return redirect("/register?error=email_taken");
		}

		// Verify email was verified
		const verified = await env.SESSIONS_KV.get(`verified:${email}`);
		if (!verified) {
			return redirect("/register?error=code_invalid");
		}

		// Hash password
		const passwordHash = await hashPassword(password);

		// Create user
		const result = await env.DB.prepare(`
			INSERT INTO users (email, password_hash, name, role, journal_id, verified, affiliation)
			VALUES (?, ?, ?, ?, ?, 1, ?)
		`).bind(email, passwordHash, name, role, journalId, affiliation).run();

		const userId = result.meta.last_row_id as number;

		// Clear verification key
		await env.SESSIONS_KV.delete(`verified:${email}`);

		// Create session
		const sessionData = {
			userId,
			email,
			name,
			role: role as "author" | "editor" | "reviewer",
			journalId,
		};

		const token = await createSession(env.SESSIONS_KV, sessionData);

		return new Response(null, {
			status: 302,
			headers: {
				Location: `/${role}?welcome=1`,
				"Set-Cookie": setSessionCookie(token),
			},
		});
	} catch (err) {
		console.error("Register error:", err);
		return redirect("/register?error=服务器错误，请稍后重试");
	}
};
