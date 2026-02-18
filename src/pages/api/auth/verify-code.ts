import type { APIRoute } from "astro";
import { verifyCode } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, locals }) => {
	const json = await request.json() as { email?: string; code?: string };
	const email = (json.email || "").trim().toLowerCase();
	const code = (json.code || "").trim();

	if (!email || !code) {
		return new Response(JSON.stringify({ valid: false, error: "缺少参数" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const env = locals.runtime?.env;
	if (!env?.SESSIONS_KV) {
		// Dev mode: accept code 123456
		const valid = code === "123456";
		return new Response(JSON.stringify({ valid }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const valid = await verifyCode(env.SESSIONS_KV, email, code);
		// Re-store for the final registration step (we'll verify again)
		if (valid && env.SESSIONS_KV) {
			await env.SESSIONS_KV.put(`verified:${email}`, "1", { expirationTtl: 600 });
		}
		return new Response(JSON.stringify({ valid }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		return new Response(JSON.stringify({ valid: false, error: "验证失败" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
