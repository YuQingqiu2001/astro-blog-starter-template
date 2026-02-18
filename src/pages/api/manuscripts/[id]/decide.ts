import type { APIRoute } from "astro";
import { sendEmail, decisionEmailHtml } from "../../../../lib/email";

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

	const formData = await request.formData();
	const decision = formData.get("decision") as string || "";
	const comments = (formData.get("comments") as string || "").trim();

	if (!["accept", "revision", "reject"].includes(decision)) {
		return redirect(`/editor/manuscript/${id}?error=无效的决定类型`);
	}

	try {
		// Get manuscript & submitter info
		const manuscript = await env.DB.prepare(`
			SELECT m.*, u.email as submitter_email, u.name as submitter_name
			FROM manuscripts m
			JOIN users u ON m.submitter_id = u.id
			WHERE m.id = ? AND m.journal_id = ?
		`).bind(id, user.journalId).first() as any;

		if (!manuscript) {
			return redirect("/editor");
		}

		// Record editorial decision
		await env.DB.prepare(`
			INSERT INTO editorial_decisions (manuscript_id, editor_id, decision, comments)
			VALUES (?, ?, ?, ?)
		`).bind(id, user.id, decision, comments).run();

		// Update manuscript status
		const newStatus =
			decision === "accept"
				? "accepted"
				: decision === "revision"
					? "revision_requested"
					: "rejected";

		await env.DB.prepare(`
			UPDATE manuscripts
			SET status = ?, editor_id = ?, editor_comment = ?, updated_at = datetime('now')
			WHERE id = ?
		`).bind(newStatus, user.id, comments, id).run();

		// Send email to author
		const siteUrl = env.SITE_URL || "https://example.com";
		const siteName = env.SITE_NAME || "玄学前沿期刊群";
		await sendEmail({
			to: manuscript.submitter_email,
			toName: manuscript.submitter_name,
			from: env.EMAIL_FROM || "noreply@example.com",
			fromName: siteName,
			subject: `【${siteName}】稿件审理结果通知：《${manuscript.title}》`,
			html: decisionEmailHtml(manuscript.title, decision, comments, siteName, siteUrl),
		});

		return redirect(`/editor/manuscript/${id}?success=决定已发送`);
	} catch (err) {
		console.error("Decision error:", err);
		return redirect(`/editor/manuscript/${id}?error=操作失败`);
	}
};
