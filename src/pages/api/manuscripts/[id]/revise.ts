import type { APIRoute } from "astro";
import { uploadFile, generateR2Key } from "../../../../lib/r2";

export const POST: APIRoute = async ({ request, locals, params, redirect }) => {
	const user = locals.user;
	if (!user || user.role !== "author") {
		return redirect("/login");
	}

	const id = parseInt(params.id!);
	const env = locals.runtime?.env;
	if (!env?.DB || !env?.MANUSCRIPTS_BUCKET) {
		return redirect(`/author/manuscript/${id}?error=服务暂时不可用`);
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return redirect(`/author/manuscript/${id}?error=表单解析失败`);
	}

	const manuscriptFile = formData.get("manuscript") as File | null;
	const responseLetter = (formData.get("response_letter") as string || "").trim();

	if (!manuscriptFile || manuscriptFile.size === 0) {
		return redirect(`/author/manuscript/${id}?error=请上传修改稿文件`);
	}

	try {
		// Get current version
		const manuscript = await env.DB.prepare(
			"SELECT * FROM manuscripts WHERE id = ? AND submitter_id = ?"
		).bind(id, user.id).first() as any;

		if (!manuscript || manuscript.status !== "revision_requested") {
			return redirect("/author");
		}

		const newVersion = (manuscript.version || 1) + 1;

		// Upload revised manuscript
		const r2Key = await generateR2Key(`manuscripts/${user.id}/v${newVersion}`, manuscriptFile.name);
		await uploadFile(env.MANUSCRIPTS_BUCKET, r2Key, manuscriptFile, "application/pdf");

		// Save revision record
		await env.DB.prepare(`
			INSERT INTO manuscript_revisions (manuscript_id, version, r2_key, response_letter)
			VALUES (?, ?, ?, ?)
		`).bind(id, newVersion, r2Key, responseLetter).run();

		// Update manuscript
		await env.DB.prepare(`
			UPDATE manuscripts
			SET status = 'resubmitted', version = ?, r2_key = ?, updated_at = datetime('now')
			WHERE id = ?
		`).bind(newVersion, r2Key, id).run();

		return redirect(`/author/manuscript/${id}?success=修改稿已提交`);
	} catch (err) {
		console.error("Revise error:", err);
		return redirect(`/author/manuscript/${id}?error=提交失败`);
	}
};
