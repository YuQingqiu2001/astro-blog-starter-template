import type { APIRoute } from "astro";
import { generateCode, storeVerificationCode } from "../../../lib/auth";
import { sendEmail, verificationEmailHtml } from "../../../lib/email";

export const POST: APIRoute = async ({ request, locals }) => {
	const json = await request.json() as { email?: string };
	const email = (json.email || "").trim().toLowerCase();

	if (!email || !email.includes("@") || !email.includes(".")) {
		return new Response(JSON.stringify({ success: false, error: "无效的邮箱地址" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const env = locals.runtime?.env;
	if (!env?.SESSIONS_KV) {
		// In dev mode without KV, return a mock code
		console.log(`[DEV] Verification code for ${email}: 123456`);
		return new Response(JSON.stringify({ success: true }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const code = generateCode();
		await storeVerificationCode(env.SESSIONS_KV, email, code);

		const siteName = env.SITE_NAME || "玄学前沿期刊群";
		const fromEmail = env.EMAIL_FROM || "noreply@example.com";

		const sent = await sendEmail({
			to: email,
			from: fromEmail,
			fromName: siteName,
			subject: `【${siteName}】邮箱验证码`,
			html: verificationEmailHtml(code, siteName),
			text: `您的验证码是：${code}，有效期10分钟。`,
		});

		if (!sent) {
			// Log for debugging in case email fails
			console.warn(`Email failed to send to ${email}, code: ${code}`);
		}

		return new Response(JSON.stringify({ success: true }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		console.error("Send code error:", err);
		return new Response(JSON.stringify({ success: false, error: "发送失败，请稍后重试" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
