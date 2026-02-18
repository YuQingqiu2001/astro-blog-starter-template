import type { APIRoute } from "astro";

interface OrcidTokenResponse {
	orcid?: string;
	sub?: string;
	error?: string;
	error_description?: string;
}

export const GET: APIRoute = async ({ url, locals, redirect }) => {
	const env = locals.runtime?.env as Record<string, any> | undefined;
	const siteUrl = env?.SITE_URL || "https://rubbishpublishing.org";
	const clientId = env?.ORCID_CLIENT_ID || "";
	const clientSecret = env?.ORCID_CLIENT_SECRET || "";
	const code = url.searchParams.get("code") || "";
	const state = url.searchParams.get("state") || "";
	const remoteError = url.searchParams.get("error") || "";
	const remoteErrorDescription = url.searchParams.get("error_description") || "";

	if (remoteError) {
		return redirect(`/orcid/callback?error=${encodeURIComponent(remoteError)}&error_description=${encodeURIComponent(remoteErrorDescription)}&state=${encodeURIComponent(state)}`);
	}

	if (!clientId || !clientSecret || !code || !state) {
		return redirect(`/orcid/callback?error=missing_configuration&state=${encodeURIComponent(state)}`);
	}

	const redirectUri = `${siteUrl}/api/orcid/callback`;

	try {
		const tokenResponse = await fetch("https://orcid.org/oauth/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Accept: "application/json",
			},
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: "authorization_code",
				code,
				redirect_uri: redirectUri,
			}).toString(),
		});

		const tokenData = (await tokenResponse.json()) as OrcidTokenResponse;
		const orcid = tokenData.orcid || tokenData.sub || "";
		if (!tokenResponse.ok || !orcid) {
			const error = tokenData.error || "orcid_exchange_failed";
			const errorDescription = tokenData.error_description || "Failed to exchange ORCID authorization code.";
			return redirect(`/orcid/callback?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription)}&state=${encodeURIComponent(state)}`);
		}

		return redirect(`/orcid/callback?orcid=${encodeURIComponent(orcid)}&state=${encodeURIComponent(state)}`);
	} catch (error) {
		console.error("ORCID callback error:", error);
		return redirect(`/orcid/callback?error=orcid_exchange_failed&state=${encodeURIComponent(state)}`);
	}
};
