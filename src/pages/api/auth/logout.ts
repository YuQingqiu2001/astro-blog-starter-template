import type { APIRoute } from "astro";
import { getSessionToken, destroySession, clearSessionCookie } from "../../../lib/auth";

export const GET: APIRoute = async ({ request, locals }) => {
	const token = getSessionToken(request);
	const env = locals.runtime?.env;
	if (token && env?.DB) {
		await destroySession({ kv: env.SESSIONS_KV, db: env.DB }, token);
	}

	return new Response(null, {
		status: 302,
		headers: {
			Location: "/",
			"Set-Cookie": clearSessionCookie(),
		},
	});
};
