interface Env {
	ASSETS: Fetcher;
	DB?: D1Database;
	rpg?: D1Database;
	RPG?: D1Database;
	journal_db?: D1Database;
	JOURNAL_DB?: D1Database;
	MANUSCRIPTS_BUCKET?: R2Bucket;
	MY_BUCKET?: R2Bucket;
	article?: R2Bucket;
	ARTICLE?: R2Bucket;
	journal_artical?: R2Bucket;
	JOURNAL_ARTICAL?: R2Bucket;
	journal_article?: R2Bucket;
	JOURNAL_ARTICLE?: R2Bucket;
	SESSIONS_KV?: KVNamespace;
	rubbish?: KVNamespace;
	RUBBISH?: KVNamespace;
	session_kv?: KVNamespace;
	SESSION_KV?: KVNamespace;
	EMAIL_FROM: string;
	SITE_NAME: string;
	SITE_URL: string;
	RESEND_API_KEY?: string;
	ORCID_CLIENT_ID?: string;
	ORCID_CLIENT_SECRET?: string;
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
