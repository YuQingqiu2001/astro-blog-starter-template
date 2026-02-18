export function getDb(env: Record<string, any> | undefined): D1Database | undefined {
	return (env?.DB || env?.rpg || env?.RPG || env?.journal_db || env?.JOURNAL_DB) as D1Database | undefined;
}

export function getKv(env: Record<string, any> | undefined): KVNamespace | undefined {
	return (env?.SESSIONS_KV || env?.rubbish || env?.RUBBISH || env?.session_kv || env?.SESSION_KV) as KVNamespace | undefined;
}

export function getManuscriptsBucket(env: Record<string, any> | undefined): R2Bucket | undefined {
	return (
		env?.MANUSCRIPTS_BUCKET ||
		env?.MY_BUCKET ||
		env?.article ||
		env?.ARTICLE ||
		env?.journal_artical ||
		env?.JOURNAL_ARTICAL ||
		env?.journal_article ||
		env?.JOURNAL_ARTICLE
	) as R2Bucket | undefined;
}
