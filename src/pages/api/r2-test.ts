import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
	const r2 = locals.runtime?.env?.article;
	if (!r2) {
		return new Response("R2 binding 'article' is not configured", { status: 503 });
	}

	await r2.put("test.txt", "hello r2");
	const obj = await r2.get("test.txt");
	return new Response(obj ? await obj.text() : "missing");
};
