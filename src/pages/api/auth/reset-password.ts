import type { APIRoute } from "astro";
import { hashPassword } from "../../../lib/auth";
import { getDb } from "../../../lib/runtime-env";

async function sha256Hex(input: string): Promise<string> {
	const bytes = new TextEncoder().encode(input);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
	const env = locals.runtime?.env as Record<string, any> | undefined;
	const db = getDb(env);
	if (!db) {
		return redirect("/reset-password?error=service_unavailable");
	}

	const formData = await request.formData();
	const token = ((formData.get("token") as string) || "").trim();
	const password = (formData.get("password") as string) || "";
	const password2 = (formData.get("password2") as string) || "";

	if (!token || !password || !password2) {
		return redirect(`/reset-password?token=${encodeURIComponent(token)}&error=missing_fields`);
	}

	if (password.length < 8) {
		return redirect(`/reset-password?token=${encodeURIComponent(token)}&error=weak_password`);
	}

	if (password !== password2) {
		return redirect(`/reset-password?token=${encodeURIComponent(token)}&error=password_mismatch`);
	}

	try {
		const tokenHash = await sha256Hex(token);
		const resetRow = await db.prepare(`
			SELECT id, user_id
			FROM password_reset_tokens
			WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')
		`).bind(tokenHash).first() as { id: number; user_id: number } | null;

		if (!resetRow) {
			return redirect("/reset-password?error=invalid_or_expired");
		}

		const passwordHash = await hashPassword(password);
		await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(passwordHash, resetRow.user_id).run();
		await db.prepare("UPDATE password_reset_tokens SET used_at = datetime('now') WHERE id = ?").bind(resetRow.id).run();

		return redirect("/login?reset=1");
	} catch (error) {
		console.error("Reset password error:", error);
		return redirect(`/reset-password?token=${encodeURIComponent(token)}&error=server_error`);
	}
};
