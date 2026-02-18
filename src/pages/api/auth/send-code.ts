import type { APIRoute } from "astro";
import { generateCode, storeVerificationCode } from "../../../lib/auth";
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

	const env = locals.runtime?.env;
	if (!env?.SESSIONS_KV) {
		// Dev mode without KV: log the code and return success
		console.log(`[DEV] Verification code for ${email}: 123456`);
		return new Response(JSON.stringify({ success: true }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	// Rate limiting: allow at most 1 code per 60 seconds per email
	const rateLimitKey = `ratelimit:send-code:${email}`;
	const recentlySent = await env.SESSIONS_KV.get(rateLimitKey);
	if (recentlySent) {
		return new Response(JSON.stringify({ success: false, error: "Please wait 60 seconds before requesting another code" }), {
			status: 429,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Check if email already registered (skip board placeholder accounts)
	if (env.DB) {
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
			// DB check failed — continue anyway
		}
	}

	try {
		const code = generateCode();
		await storeVerificationCode(env.SESSIONS_KV, email, code);

		// Set rate limit (60s TTL)
		await env.SESSIONS_KV.put(rateLimitKey, "1", { expirationTtl: 60 });

		const siteName = env.SITE_NAME || "Rubbish Publishing Group";
		const fromEmail = env.EMAIL_FROM || "noreply@example.com";

		const sent = await sendEmail({
			to: email,
			from: fromEmail,
			fromName: siteName,
			subject: `[${siteName}] Your verification code`,
			html: verificationEmailHtml(code, siteName),
			text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
		});

		if (!sent) {
			console.warn(`Email delivery failed for ${email} (code: ${code})`);
			// Remove rate limit so user can try again
			await env.SESSIONS_KV.delete(rateLimitKey);
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
