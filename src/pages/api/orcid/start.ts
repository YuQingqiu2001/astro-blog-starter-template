import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, locals, redirect }) => {
	const env = locals.runtime?.env as Record<string, any> | undefined;
	const clientId = env?.ORCID_CLIENT_ID || "";
	const state = url.searchParams.get("state") || "";
	const origin = url.origin;

	if (!clientId || !state) {
		return redirect(`/orcid/callback?error=missing_configuration&error_description=${encodeURIComponent("ORCID client is not configured on the server.")}&state=${encodeURIComponent(state)}`);
	}

	const redirectUri = `${origin}/api/orcid/callback`;
	const params = new URLSearchParams({
		client_id: clientId,
		response_type: "code",
		scope: "/authenticate",
		redirect_uri: redirectUri,
		state,
	});

	return redirect(`https://orcid.org/oauth/authorize?${params.toString()}`);
};
