import type { APIRoute } from "astro";
import { getKv } from "../../lib/runtime-env";

export const GET: APIRoute = async ({ locals }) => {
	const env = locals.runtime?.env as Record<string, any> | undefined;
	const kv = getKv(env);
	if (!kv) {
		return new Response("KV binding not configured (SESSIONS_KV/rubbish)", { status: 503 });
	}

	await kv.put("hello", "world");
	const v = await kv.get("hello");
	return new Response(v ?? "null");
};
