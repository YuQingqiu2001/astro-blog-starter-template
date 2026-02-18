import type { APIRoute } from "astro";
import { getDb } from "../../lib/runtime-env";

export const GET: APIRoute = async ({ locals }) => {
	const env = locals.runtime?.env as Record<string, any> | undefined;
	const db = getDb(env);
	if (!db) {
		return new Response(JSON.stringify({ ok: 0, error: "D1 binding not configured (DB/rpg)" }), {
			status: 503,
			headers: { "Content-Type": "application/json" },
		});
	}

	const r = await db.prepare("SELECT 1 AS ok").first();
	return Response.json(r ?? { ok: 0 });
};
