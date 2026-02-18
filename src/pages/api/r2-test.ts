import type { APIRoute } from "astro";
import { getManuscriptsBucket } from "../../lib/runtime-env";

export const GET: APIRoute = async ({ locals }) => {
	const env = locals.runtime?.env as Record<string, any> | undefined;
	const bucket = getManuscriptsBucket(env);
	if (!bucket) {
		return new Response("R2 binding not configured (MANUSCRIPTS_BUCKET/MY_BUCKET/article)", { status: 503 });
	}

	await bucket.put("test.txt", "hello r2");
	const obj = await bucket.get("test.txt");
	return new Response(obj ? await obj.text() : "missing");
};
