import type { SessionData } from "./types";

// Password hashing using WebCrypto PBKDF2 (compatible with Cloudflare Workers)
export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const salt = crypto.getRandomValues(new Uint8Array(16));

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"]
	);

	const hashBuffer = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: 100000,
			hash: "SHA-256",
		},
		keyMaterial,
		256
	);

	const hashArray = new Uint8Array(hashBuffer);
	const saltHex = Array.from(salt)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	const hashHex = Array.from(hashArray)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(
	password: string,
	stored: string
): Promise<boolean> {
	const [saltHex, hashHex] = stored.split(":");
	if (!saltHex || !hashHex) return false;

	const salt = new Uint8Array(
		saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16))
	);

	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"]
	);

	const hashBuffer = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: 100000,
			hash: "SHA-256",
		},
		keyMaterial,
		256
	);

	const hashArray = new Uint8Array(hashBuffer);
	const computedHex = Array.from(hashArray)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return computedHex === hashHex;
}

export function generateToken(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export function generateCode(): string {
	const num = Math.floor(100000 + Math.random() * 900000);
	return num.toString();
}

interface AuthStore {
	kv?: KVNamespace;
	db?: D1Database;
}

interface MemorySessionRecord {
	data: SessionData;
	expiresAt: number;
}

const memorySessions = (() => {
	const key = "__RPG_MEMORY_SESSIONS__";
	const g = globalThis as unknown as Record<string, Map<string, MemorySessionRecord> | undefined>;
	if (!g[key]) g[key] = new Map();
	return g[key]!;
})();

export async function createSession(store: AuthStore, data: SessionData): Promise<string> {
	const token = generateToken();

	if (store.kv) {
		const key = `session:${token}`;
		await store.kv.put(key, JSON.stringify(data), { expirationTtl: 7 * 24 * 3600 });
		return token;
	}

	if (store.db) {
		await store.db.prepare(`
			INSERT INTO user_sessions (token, user_id, email, name, role, journal_id, expires_at)
			VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))
		`).bind(token, data.userId, data.email, data.name, data.role, data.journalId).run();
		return token;
	}

	memorySessions.set(token, { data, expiresAt: Date.now() + 7 * 24 * 3600 * 1000 });
	return token;
}

export async function getSession(store: AuthStore, token: string): Promise<SessionData | null> {
	if (store.kv) {
		const raw = await store.kv.get(`session:${token}`);
		if (!raw) return null;
		try {
			return JSON.parse(raw) as SessionData;
		} catch {
			return null;
		}
	}

	if (store.db) {
		const row = await store.db.prepare(`
			SELECT user_id, email, name, role, journal_id
			FROM user_sessions
			WHERE token = ? AND expires_at > datetime('now')
		`).bind(token).first() as {
			user_id: number;
			email: string;
			name: string;
			role: "author" | "editor" | "reviewer";
			journal_id: number | null;
		} | null;
		if (!row) return null;
		return {
			userId: row.user_id,
			email: row.email,
			name: row.name,
			role: row.role,
			journalId: row.journal_id,
		};
	}

	const memory = memorySessions.get(token);
	if (!memory) return null;
	if (memory.expiresAt <= Date.now()) {
		memorySessions.delete(token);
		return null;
	}
	return memory.data;
}

export async function destroySession(store: AuthStore, token: string): Promise<void> {
	if (store.kv) {
		await store.kv.delete(`session:${token}`);
		return;
	}
	if (store.db) {
		await store.db.prepare("DELETE FROM user_sessions WHERE token = ?").bind(token).run();
		return;
	}
	memorySessions.delete(token);
}


export async function storeVerificationCode(
	store: AuthStore,
	email: string,
	code: string
): Promise<void> {
	if (store.kv) {
		await store.kv.put(`verify:${email}`, code, { expirationTtl: 600 });
		return;
	}

	if (store.db) {
		await store.db.prepare("DELETE FROM auth_verification_codes WHERE email = ?").bind(email).run();
		await store.db.prepare(`
			INSERT INTO auth_verification_codes (email, code, expires_at)
			VALUES (?, ?, datetime('now', '+10 minutes'))
		`).bind(email, code).run();
	}
}

export async function verifyCode(
	store: AuthStore,
	email: string,
	code: string
): Promise<boolean> {
	if (store.kv) {
		const stored = await store.kv.get(`verify:${email}`);
		if (!stored) return false;
		const valid = stored === code;
		if (valid) {
			await store.kv.delete(`verify:${email}`);
		}
		return valid;
	}

	if (store.db) {
		const row = await store.db.prepare(`
			SELECT code FROM auth_verification_codes
			WHERE email = ? AND expires_at > datetime('now')
		`).bind(email).first() as { code: string } | null;
		if (!row) return false;
		const valid = row.code === code;
		if (valid) {
			await store.db.prepare("DELETE FROM auth_verification_codes WHERE email = ?").bind(email).run();
		}
		return valid;
	}

	return false;
}

export async function wasRecentlyRateLimited(
	store: AuthStore,
	key: string
): Promise<boolean> {
	if (store.kv) {
		return Boolean(await store.kv.get(key));
	}
	if (store.db) {
		const row = await store.db.prepare(
			"SELECT key FROM auth_rate_limits WHERE key = ? AND expires_at > datetime('now')"
		).bind(key).first();
		return Boolean(row);
	}
	return false;
}

export async function setRateLimit(
	store: AuthStore,
	key: string,
	ttlSeconds: number
): Promise<void> {
	if (store.kv) {
		await store.kv.put(key, "1", { expirationTtl: ttlSeconds });
		return;
	}
	if (store.db) {
		await store.db.prepare("DELETE FROM auth_rate_limits WHERE key = ?").bind(key).run();
		await store.db.prepare(`
			INSERT INTO auth_rate_limits (key, expires_at)
			VALUES (?, datetime('now', '+' || ? || ' seconds'))
		`).bind(key, ttlSeconds).run();
	}
}

export async function clearRateLimit(store: AuthStore, key: string): Promise<void> {
	if (store.kv) {
		await store.kv.delete(key);
		return;
	}
	if (store.db) {
		await store.db.prepare("DELETE FROM auth_rate_limits WHERE key = ?").bind(key).run();
	}
}

export async function markEmailVerified(store: AuthStore, email: string): Promise<void> {
	if (store.kv) {
		await store.kv.put(`verified:${email}`, "1", { expirationTtl: 600 });
		return;
	}
	if (store.db) {
		await store.db.prepare("DELETE FROM auth_verified_emails WHERE email = ?").bind(email).run();
		await store.db.prepare(`
			INSERT INTO auth_verified_emails (email, expires_at)
			VALUES (?, datetime('now', '+10 minutes'))
		`).bind(email).run();
	}
}

export async function isEmailVerified(store: AuthStore, email: string): Promise<boolean> {
	if (store.kv) {
		return Boolean(await store.kv.get(`verified:${email}`));
	}
	if (store.db) {
		const row = await store.db.prepare(
			"SELECT email FROM auth_verified_emails WHERE email = ? AND expires_at > datetime('now')"
		).bind(email).first();
		return Boolean(row);
	}
	return false;
}

export async function clearVerifiedEmail(store: AuthStore, email: string): Promise<void> {
	if (store.kv) {
		await store.kv.delete(`verified:${email}`);
		return;
	}
	if (store.db) {
		await store.db.prepare("DELETE FROM auth_verified_emails WHERE email = ?").bind(email).run();
	}
}

export function getSessionToken(request: Request): string | null {
	const cookieHeader = request.headers.get("Cookie") || "";
	const cookies = Object.fromEntries(
		cookieHeader.split(";").map((c) => {
			const [k, ...v] = c.trim().split("=");
			return [k.trim(), v.join("=")];
		})
	);
	return cookies["session"] || null;
}

export function setSessionCookie(token: string): string {
	return `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 3600}`;
}

export function clearSessionCookie(): string {
	return "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0";
}
