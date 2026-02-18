export function getDb(env: Record<string, any> | undefined): D1Database | undefined {
	return (env?.DB || env?.rpg) as D1Database | undefined;
}

export function getKv(env: Record<string, any> | undefined): KVNamespace | undefined {
	return (env?.SESSIONS_KV || env?.rubbish) as KVNamespace | undefined;
}

export function getManuscriptsBucket(env: Record<string, any> | undefined): R2Bucket | undefined {
	return (env?.MANUSCRIPTS_BUCKET || env?.MY_BUCKET) as R2Bucket | undefined;
}
