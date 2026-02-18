import type { APIRoute } from "astro";
import { uploadFile, generateR2Key } from "../../../../lib/r2";

export const POST: APIRoute = async ({ request, locals, params, redirect }) => {
	const user = locals.user;
	if (!user || user.role !== "reviewer") {
		return redirect("/login");
	}

	const id = parseInt(params.id!);
	const env = locals.runtime?.env;
	if (!env?.DB) {
		return redirect(`/reviewer/manuscript/${id}?error=服务暂时不可用`);
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return redirect(`/reviewer/manuscript/${id}?error=表单解析失败`);
	}

	const recommendation = formData.get("recommendation") as string || "";
	const comments = (formData.get("comments") as string || "").trim();
	const reviewFile = formData.get("review_file") as File | null;

	if (!recommendation || !comments) {
		return redirect(`/reviewer/manuscript/${id}?error=请填写推荐决定和审稿意见`);
	}

	try {
		let reviewR2Key: string | null = null;

		// Upload review file if provided
		if (reviewFile && reviewFile.size > 0) {
			reviewR2Key = await generateR2Key(`reviews/${user.id}`, reviewFile.name);
			if (env.MANUSCRIPTS_BUCKET) {
				await uploadFile(env.MANUSCRIPTS_BUCKET, reviewR2Key, reviewFile, "application/pdf");
			}
		}

		// Update review record
		await env.DB.prepare(`
			UPDATE reviews
			SET status = 'submitted',
			    recommendation = ?,
			    comments = ?,
			    review_r2_key = ?,
			    submitted_at = datetime('now')
			WHERE manuscript_id = ? AND reviewer_id = ?
		`).bind(recommendation, comments, reviewR2Key, id, user.id).run();

		return redirect(`/reviewer/manuscript/${id}?success=审稿意见已提交`);
	} catch (err) {
		console.error("Review submit error:", err);
		return redirect(`/reviewer/manuscript/${id}?error=提交失败`);
	}
};
