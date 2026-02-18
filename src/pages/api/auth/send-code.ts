import type { APIRoute } from "astro";
import {
	generateCode,
	storeVerificationCode,
	wasRecentlyRateLimited,
	setRateLimit,
	clearRateLimit,
} from "../../../lib/auth";
import { sendEmail, verificationEmailHtml } from "../../../lib/email";

export const POST: APIRoute = async ({ request, locals }) => {
	const json = await request.json() as { email?: string };
	const email = (json.email || "").trim().toLowerCase();

	if (!email || !email.includes("@") || !email.includes(".")) {
		return new Response(JSON.stringify({ success: false, error: "Invalid email address" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (email.length > 254) {
		return new Response(JSON.stringify({ success: false, error: "Invalid email address" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const env = locals.runtime?.env;
	if (!env?.DB) {
		return new Response(JSON.stringify({ success: false, error: "Service unavailable" }), {
			status: 503,
			headers: { "Content-Type": "application/json" },
		});
	}

	const store = { kv: env.SESSIONS_KV, db: env.DB };

	const rateLimitKey = `ratelimit:send-code:${email}`;
	const recentlySent = await wasRecentlyRateLimited(store, rateLimitKey);
	if (recentlySent) {
		return new Response(JSON.stringify({ success: false, error: "Please wait 60 seconds before requesting another code" }), {
			status: 429,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const existing = await env.DB.prepare(
			"SELECT id FROM users WHERE email = ? AND password_hash != 'board_member_placeholder'"
		).bind(email).first();
		if (existing) {
			return new Response(JSON.stringify({ success: false, error: "This email is already registered. Please login instead." }), {
				status: 409,
				headers: { "Content-Type": "application/json" },
			});
		}
	} catch {
		// continue even when DB check fails
	}

	try {
		const code = generateCode();
		await storeVerificationCode(store, email, code);
		await setRateLimit(store, rateLimitKey, 60);

		const siteName = env.SITE_NAME || "Rubbish Publishing Group";
		const fromEmail = env.EMAIL_FROM || "noreply@rubbishpublishing.org";

		const sent = await sendEmail({
			to: email,
			from: fromEmail,
			fromName: siteName,
			subject: `[${siteName}] Your verification code`,
			html: verificationEmailHtml(code, siteName),
			text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
		}, env.RESEND_API_KEY);

		if (!sent) {
			await clearRateLimit(store, rateLimitKey);
			return new Response(JSON.stringify({ success: false, error: "Failed to send email. Please check your email address and try again." }), {
				status: 503,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response(JSON.stringify({ success: true }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		console.error("Send code error:", err);
		return new Response(JSON.stringify({ success: false, error: "Service error. Please try again later." }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
