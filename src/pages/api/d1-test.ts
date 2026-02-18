import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
	const db = locals.runtime?.env?.rpg;
	if (!db) {
		return new Response(JSON.stringify({ ok: 0, error: "D1 binding 'rpg' is not configured" }), {
			status: 503,
			headers: { "Content-Type": "application/json" },
		});
	}

	const r = await db.prepare("SELECT 1 AS ok").first();
	return new Response(JSON.stringify(r ?? { ok: 0 }), {
		headers: { "Content-Type": "application/json" },
	});
};
