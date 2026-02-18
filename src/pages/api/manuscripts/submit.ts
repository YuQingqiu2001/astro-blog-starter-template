import type { APIRoute } from "astro";
import { uploadFile, generateR2Key } from "../../../lib/r2";

export const POST: APIRoute = async ({ request, locals, redirect }) => {
	const user = locals.user;
	if (!user || user.role !== "author") {
		return redirect("/login");
	}

	const env = locals.runtime?.env;
	if (!env?.DB || !env?.MANUSCRIPTS_BUCKET) {
		return redirect("/author/submit?error=服务暂时不可用");
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return redirect("/author/submit?error=表单解析失败");
	}

	const title = (formData.get("title") as string || "").trim();
	const authors = (formData.get("authors") as string || "").trim();
	const abstract = (formData.get("abstract") as string || "").trim();
	const keywords = (formData.get("keywords") as string || "").trim();
	const journalIdStr = formData.get("journal_id") as string || "";
	const journalId = journalIdStr ? parseInt(journalIdStr) : 0;
	const manuscriptFile = formData.get("manuscript") as File | null;

	if (!title || !authors || !abstract || !journalId || !manuscriptFile) {
		return redirect("/author/submit?error=missing_fields");
	}

	if (manuscriptFile.size > 50 * 1024 * 1024) {
		return redirect("/author/submit?error=file_too_large");
	}

	if (!manuscriptFile.name.toLowerCase().endsWith(".pdf")) {
		return redirect("/author/submit?error=invalid_file");
	}

	try {
		// Upload to R2
		const r2Key = await generateR2Key(`manuscripts/${user.id}`, manuscriptFile.name);
		await uploadFile(env.MANUSCRIPTS_BUCKET, r2Key, manuscriptFile, "application/pdf");

		// Save to D1
		await env.DB.prepare(`
			INSERT INTO manuscripts (title, abstract, authors, keywords, journal_id, submitter_id, status, r2_key)
			VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?)
		`).bind(title, abstract, authors, keywords, journalId, user.id, r2Key).run();

		return redirect("/author/submit?success=1");
	} catch (err) {
		console.error("Submit error:", err);
		return redirect("/author/submit?error=提交失败，请稍后重试");
	}
};
