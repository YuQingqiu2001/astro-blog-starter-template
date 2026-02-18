// Cloudflare R2 helper utilities

export async function uploadFile(
	bucket: R2Bucket,
	key: string,
	file: File | Blob,
	contentType?: string
): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	await bucket.put(key, arrayBuffer, {
		httpMetadata: {
			contentType: contentType || file.type || "application/octet-stream",
		},
	});
	return key;
}

export async function generateR2Key(
	prefix: string,
	filename: string
): Promise<string> {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	const ext = filename.split(".").pop() || "pdf";
	return `${prefix}/${timestamp}-${random}.${ext}`;
}

export async function getFileUrl(
	bucket: R2Bucket,
	key: string,
	expiresIn = 3600
): Promise<string | null> {
	// Check if object exists
	const obj = await bucket.head(key);
	if (!obj) return null;
	// Return a download URL via our API endpoint (signed via session cookie)
	return `/api/download/${encodeURIComponent(key)}`;
}

export async function deleteFile(
	bucket: R2Bucket,
	key: string
): Promise<void> {
	await bucket.delete(key);
}

export async function getFileStream(
	bucket: R2Bucket,
	key: string
): Promise<{ body: ReadableStream; contentType: string; size: number } | null> {
	const obj = await bucket.get(key);
	if (!obj) return null;
	return {
		body: obj.body,
		contentType: obj.httpMetadata?.contentType || "application/octet-stream",
		size: obj.size,
	};
}
