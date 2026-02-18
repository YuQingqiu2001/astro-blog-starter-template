import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return new Response("Unauthorized", { status: 401 });
	}

	const key = params.key;
	if (!key) {
		return new Response("Not Found", { status: 404 });
	}

	const env = locals.runtime?.env;
	if (!env?.MANUSCRIPTS_BUCKET) {
		return new Response("Storage not available", { status: 503 });
	}

	try {
		const obj = await env.MANUSCRIPTS_BUCKET.get(key);
		if (!obj) {
			return new Response("File not found", { status: 404 });
		}

		const filename = key.split("/").pop() || "document.pdf";

		return new Response(obj.body, {
			headers: {
				"Content-Type": obj.httpMetadata?.contentType || "application/pdf",
				"Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
				"Cache-Control": "private, max-age=3600",
			},
		});
	} catch (err) {
		console.error("Download error:", err);
		return new Response("Download failed", { status: 500 });
	}
};
