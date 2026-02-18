import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, locals, redirect }) => {
	const env = locals.runtime?.env as Record<string, any> | undefined;
	const siteUrl = env?.SITE_URL || "https://rubbishpublishing.org";
	const clientId = env?.ORCID_CLIENT_ID || "";
	const state = url.searchParams.get("state") || "";

	if (!clientId || !state) {
		return redirect(`/orcid/callback?error=missing_configuration&state=${encodeURIComponent(state)}`);
	}

	const redirectUri = `${siteUrl}/api/orcid/callback`;
	const params = new URLSearchParams({
		client_id: clientId,
		response_type: "code",
		scope: "/authenticate",
		redirect_uri: redirectUri,
		state,
	});

	return redirect(`https://orcid.org/oauth/authorize?${params.toString()}`);
};
