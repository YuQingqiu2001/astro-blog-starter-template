import type { APIRoute } from "astro";
import { getSessionToken, destroySession, clearSessionCookie } from "../../../lib/auth";

export const GET: APIRoute = async ({ request, locals }) => {
	const token = getSessionToken(request);
	if (token && locals.runtime?.env?.SESSIONS_KV) {
		await destroySession(locals.runtime.env.SESSIONS_KV, token);
	}

	return new Response(null, {
		status: 302,
		headers: {
			Location: "/",
			"Set-Cookie": clearSessionCookie(),
		},
	});
};
