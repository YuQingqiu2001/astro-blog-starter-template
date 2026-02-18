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

export async function createSession(
	kv: KVNamespace,
	data: SessionData
): Promise<string> {
	const token = generateToken();
	const key = `session:${token}`;
	// Session expires in 7 days
	await kv.put(key, JSON.stringify(data), { expirationTtl: 7 * 24 * 3600 });
	return token;
}

export async function getSession(
	kv: KVNamespace,
	token: string
): Promise<SessionData | null> {
	const key = `session:${token}`;
	const raw = await kv.get(key);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as SessionData;
	} catch {
		return null;
	}
}

export async function destroySession(
	kv: KVNamespace,
	token: string
): Promise<void> {
	await kv.delete(`session:${token}`);
}

export async function storeVerificationCode(
	kv: KVNamespace,
	email: string,
	code: string
): Promise<void> {
	await kv.put(`verify:${email}`, code, { expirationTtl: 600 }); // 10 minutes
}

export async function verifyCode(
	kv: KVNamespace,
	email: string,
	code: string
): Promise<boolean> {
	const stored = await kv.get(`verify:${email}`);
	if (!stored) return false;
	const valid = stored === code;
	if (valid) {
		await kv.delete(`verify:${email}`);
	}
	return valid;
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
	return `session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}
