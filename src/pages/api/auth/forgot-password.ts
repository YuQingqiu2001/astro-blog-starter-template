import type { APIRoute } from "astro";
import { generateToken } from "../../../lib/auth";
import { sendEmail } from "../../../lib/email";
import { getDb } from "../../../lib/runtime-env";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sha256Hex(input: string): Promise<string> {
	const bytes = new TextEncoder().encode(input);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
	const env = locals.runtime?.env as Record<string, any> | undefined;
	const db = getDb(env);
	if (!db) {
		return redirect("/forgot-password?sent=1");
	}

	const formData = await request.formData();
	const email = ((formData.get("email") as string) || "").trim().toLowerCase();

	if (!email || !EMAIL_PATTERN.test(email)) {
		return redirect("/forgot-password?error=invalid_email");
	}

	try {
		const user = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first() as { id: number } | null;
		if (user) {
			const token = generateToken();
			const tokenHash = await sha256Hex(token);
			await db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at < datetime('now')").bind(user.id).run();
			await db.prepare(`
				INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
				VALUES (?, ?, datetime('now', '+30 minutes'))
			`).bind(user.id, tokenHash).run();

			const siteUrl = env?.SITE_URL || new URL(request.url).origin;
			const siteName = env?.SITE_NAME || "Rubbish Publishing Group";
			const from = env?.EMAIL_FROM || "noreply@rubbishpublishing.org";
			const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(token)}`;
			const html = `
				<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:16px;">
					<h2>Password Reset Request</h2>
					<p>We received a request to reset your password for ${siteName}.</p>
					<p><a href="${resetUrl}" style="display:inline-block;background:#1A2A4A;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;">Reset Password</a></p>
					<p>If the button does not work, copy this link into your browser:</p>
					<p>${resetUrl}</p>
					<p>This link will expire in 30 minutes.</p>
				</div>
			`;
			await sendEmail({
				to: email,
				from,
				subject: `${siteName} Password Reset`,
				html,
				text: `Reset your password: ${resetUrl} (expires in 30 minutes)`,
			}, env?.RESEND_API_KEY);
		}

		return redirect("/forgot-password?sent=1");
	} catch (error) {
		console.error("Forgot password error:", error);
		return redirect("/forgot-password?sent=1");
	}
};
