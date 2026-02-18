import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
	const kv = locals.runtime?.env?.rubbish;
	if (!kv) {
		return new Response("KV binding 'rubbish' is not configured", { status: 503 });
	}

	await kv.put("hello", "world");
	const v = await kv.get("hello");
	return new Response(v ?? "null");
};
