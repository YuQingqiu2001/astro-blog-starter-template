import type { APIRoute } from "astro";
import { verifyPassword, createSession, setSessionCookie } from "../../../lib/auth";

function normalizeRedirectPath(input: string): string {
	if (!input || !input.startsWith("/") || input.startsWith("//")) {
		return "";
	}
	return input;
}

const allowedRoles = ["author", "editor", "reviewer"] as const;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
	const formData = await request.formData();
	const email = (formData.get("email") as string || "").trim().toLowerCase();
	const password = formData.get("password") as string || "";
	const selectedRole = (formData.get("role") as string || "author").trim();
	const captchaExpected = (formData.get("captcha_expected") as string || "").trim();
	const captchaAnswer = (formData.get("captcha_answer") as string || "").trim();
	const redirectTo = normalizeRedirectPath((formData.get("redirect") as string || "").trim());

	if (!email || !password || !captchaExpected || !captchaAnswer) {
		return redirect("/login?error=invalid");
	}

	if (captchaExpected !== captchaAnswer) {
		return redirect("/login?error=captcha_failed");
	}

	if (!allowedRoles.includes(selectedRole as typeof allowedRoles[number])) {
		return redirect("/login?error=invalid");
	}

	if (email.length > 254) {
		return redirect("/login?error=invalid");
	}

	const env = locals.runtime?.env;
	if (!env?.DB) {
		return redirect("/login?error=unavailable");
	}

	try {
		const user = await env.DB.prepare(
			"SELECT id, email, password_hash, name, role, journal_id FROM users WHERE email = ? AND verified = 1"
		).bind(email).first() as {
			id: number;
			email: string;
			password_hash: string;
			name: string;
			role: "author" | "editor" | "reviewer";
			journal_id: number | null;
		} | null;

		if (!user) {
			return redirect("/login?error=invalid");
		}

		if (user.role !== selectedRole) {
			return redirect("/login?error=role_mismatch");
		}

		const valid = await verifyPassword(password, user.password_hash);
		if (!valid) {
			return redirect("/login?error=invalid");
		}

		const token = await createSession({ kv: env.SESSIONS_KV, db: env.DB }, {
			userId: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			journalId: user.journal_id,
		});

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
		return redirect("/login?error=unavailable");
	}
};
