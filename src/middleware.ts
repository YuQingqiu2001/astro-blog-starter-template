import { defineMiddleware } from "astro:middleware";
import { getSession, getSessionToken } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
	const token = getSessionToken(context.request);

	if (token && context.locals.runtime?.env?.SESSIONS_KV) {
		try {
			const session = await getSession(context.locals.runtime.env.SESSIONS_KV, token);
			if (session) {
				context.locals.user = {
					id: session.userId,
					email: session.email,
					name: session.name,
					role: session.role,
					journalId: session.journalId,
				};
			}
		} catch {
			// Session lookup failed, continue without user
		}
	}

	// Protected routes
	const pathname = new URL(context.request.url).pathname;
	const protectedPrefixes = ["/author", "/editor", "/reviewer"];
	const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

	if (isProtected && !context.locals.user) {
		return context.redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
	}

	// Role-based access
	if (context.locals.user) {
		const role = context.locals.user.role;
		if (pathname.startsWith("/author") && role !== "author") {
			return context.redirect(`/${role}`);
		}
		if (pathname.startsWith("/editor") && role !== "editor") {
			return context.redirect(`/${role}`);
		}
		if (pathname.startsWith("/reviewer") && role !== "reviewer") {
			return context.redirect(`/${role}`);
		}
	}

	return next();
});
