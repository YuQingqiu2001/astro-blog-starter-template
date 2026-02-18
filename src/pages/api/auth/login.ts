import type { APIRoute } from "astro";
import { verifyPassword, createSession, setSessionCookie } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, locals, redirect }) => {
	const formData = await request.formData();
	const email = (formData.get("email") as string || "").trim().toLowerCase();
	const password = (formData.get("password") as string || "");
	const redirectTo = (formData.get("redirect") as string || "").trim();

	if (!email || !password) {
		return redirect("/login?error=invalid");
	}

	const env = locals.runtime?.env;
	if (!env?.DB || !env?.SESSIONS_KV) {
		return redirect("/login?error=服务暂时不可用");
	}

	try {
		const user = await env.DB.prepare(
			"SELECT * FROM users WHERE email = ? AND verified = 1"
		).bind(email).first() as any;

		if (!user) {
			return redirect("/login?error=invalid");
		}

		const valid = await verifyPassword(password, user.password_hash);
		if (!valid) {
			return redirect("/login?error=invalid");
		}

		const sessionData = {
			userId: user.id,
			email: user.email,
			name: user.name,
			role: user.role as "author" | "editor" | "reviewer",
			journalId: user.journal_id,
		};

		const token = await createSession(env.SESSIONS_KV, sessionData);

		const dest = redirectTo || `/${user.role}`;
		return new Response(null, {
			status: 302,
			headers: {
				Location: dest,
				"Set-Cookie": setSessionCookie(token),
			},
		});
	} catch (err) {
		console.error("Login error:", err);
		return redirect("/login?error=服务器错误，请稍后重试");
	}
};
