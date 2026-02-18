interface Env {
	ASSETS: Fetcher;
	DB: D1Database;
	MANUSCRIPTS_BUCKET: R2Bucket;
	SESSIONS_KV: KVNamespace;
	EMAIL_FROM: string;
	SITE_NAME: string;
	SITE_URL: string;
	RESEND_API_KEY: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {
		user?: {
			id: number;
			email: string;
			name: string;
			role: "author" | "editor" | "reviewer";
			journalId: number | null;
		};
	}
}
