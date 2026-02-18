import type { APIRoute } from "astro";

// Email-code registration has been removed.
// Keep this endpoint for backward compatibility with old clients.
export const POST: APIRoute = async () => {
	return new Response(
		JSON.stringify({
			success: false,
			error: "Email verification is no longer required. Please register directly.",
		}),
		{
			status: 410,
			headers: { "Content-Type": "application/json" },
		}
	);
};
