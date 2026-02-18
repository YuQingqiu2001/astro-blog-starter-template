import type { APIRoute } from "astro";
import { verifyCode, markEmailVerified } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, locals }) => {
	const json = await request.json() as { email?: string; code?: string };
	const email = (json.email || "").trim().toLowerCase();
	const code = (json.code || "").trim();

	if (!email || !code) {
		return new Response(JSON.stringify({ valid: false, error: "missing_params" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const env = locals.runtime?.env;
	if (!env?.DB) {
		return new Response(JSON.stringify({ valid: false, error: "service_unavailable" }), {
			status: 503,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const store = { kv: env.SESSIONS_KV, db: env.DB };
		const valid = await verifyCode(store, email, code);
		if (valid) {
			await markEmailVerified(store, email);
		}
		return new Response(JSON.stringify({ valid }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch {
		return new Response(JSON.stringify({ valid: false, error: "verify_failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
