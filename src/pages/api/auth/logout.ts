import type { APIRoute } from "astro";
import { getSessionToken, destroySession, clearSessionCookie } from "../../../lib/auth";
import { getDb, getKv } from "../../../lib/runtime-env";

export const GET: APIRoute = async ({ request, locals }) => {
	const token = getSessionToken(request);
	const env = locals.runtime?.env;
	const db = getDb(env as any);
	const kv = getKv(env as any);
	if (token) {
		await destroySession({ kv, db }, token);
	}

	return new Response(null, {
		status: 302,
		headers: {
			Location: "/",
			"Set-Cookie": clearSessionCookie(),
		},
	});
};
