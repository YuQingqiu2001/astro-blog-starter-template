import type { APIRoute } from "astro";
import { uploadFile, generateR2Key } from "../../../../lib/r2";

export const POST: APIRoute = async ({ request, locals, params, redirect }) => {
	const user = locals.user;
	if (!user || user.role !== "editor") {
		return redirect("/login");
	}

	const id = parseInt(params.id!);
	const env = locals.runtime?.env;
	if (!env?.DB) {
		return redirect(`/editor/manuscript/${id}?error=服务暂时不可用`);
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return redirect(`/editor/manuscript/${id}?error=表单解析失败`);
	}

	const finalFile = formData.get("final_manuscript") as File | null;
	const volumeStr = formData.get("volume") as string || "";
	const issueStr = formData.get("issue") as string || "";
	const doi = (formData.get("doi") as string || "").trim();
	const volume = volumeStr ? parseInt(volumeStr) : null;
	const issue = issueStr ? parseInt(issueStr) : null;

	try {
		const manuscript = await env.DB.prepare(
			"SELECT * FROM manuscripts WHERE id = ? AND journal_id = ? AND status = 'accepted'"
		).bind(id, user.journalId).first() as any;

		if (!manuscript) {
			return redirect("/editor");
		}

		let publishR2Key = manuscript.r2_key;

		// Upload final version if provided
		if (finalFile && finalFile.size > 0 && env.MANUSCRIPTS_BUCKET) {
			publishR2Key = await generateR2Key(`published/${manuscript.journal_id}`, finalFile.name);
			await uploadFile(env.MANUSCRIPTS_BUCKET, publishR2Key, finalFile, "application/pdf");
		}

		// Create published article record
		await env.DB.prepare(`
			INSERT INTO published_articles
			(manuscript_id, journal_id, title, abstract, authors, keywords, r2_key, doi, volume, issue)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(
			id, manuscript.journal_id,
			manuscript.title, manuscript.abstract,
			manuscript.authors, manuscript.keywords,
			publishR2Key, doi || null, volume, issue
		).run();

		// Update manuscript status
		await env.DB.prepare(
			"UPDATE manuscripts SET status = 'published', updated_at = datetime('now') WHERE id = ?"
		).bind(id).run();

		return redirect(`/editor/manuscript/${id}?success=稿件已正式发布`);
	} catch (err) {
		console.error("Publish error:", err);
		return redirect(`/editor/manuscript/${id}?error=发布失败`);
	}
};
