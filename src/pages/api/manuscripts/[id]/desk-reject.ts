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
	const comments = (formData.get("comments") as string || "").trim();

	if (!comments) {
		return redirect(`/editor/manuscript/${id}?error=请填写拒稿理由`);
	}

	try {
		// Get manuscript & submitter
		const manuscript = await env.DB.prepare(`
			SELECT m.*, u.email as submitter_email, u.name as submitter_name
			FROM manuscripts m
			JOIN users u ON m.submitter_id = u.id
			WHERE m.id = ? AND m.journal_id = ?
		`).bind(id, user.journalId).first() as any;

		if (!manuscript) {
			return redirect("/editor");
		}

		// Record decision
		await env.DB.prepare(`
			INSERT INTO editorial_decisions (manuscript_id, editor_id, decision, comments)
			VALUES (?, ?, 'reject', ?)
		`).bind(id, user.id, comments).run();

		// Update manuscript
		await env.DB.prepare(`
			UPDATE manuscripts SET status = 'rejected', editor_id = ?, editor_comment = ?, updated_at = datetime('now')
			WHERE id = ?
		`).bind(user.id, comments, id).run();

		// Send notification email
		const siteUrl = env.SITE_URL || "https://example.com";
		const siteName = env.SITE_NAME || "玄学前沿期刊群";
		await sendEmail({
			to: manuscript.submitter_email,
			toName: manuscript.submitter_name,
			from: env.EMAIL_FROM || "noreply@example.com",
			fromName: siteName,
			subject: `【${siteName}】稿件处理结果通知`,
			html: decisionEmailHtml(manuscript.title, "reject", comments, siteName, siteUrl),
		});

		return redirect(`/editor/manuscript/${id}?success=已拒稿并通知作者`);
	} catch (err) {
		console.error("Desk reject error:", err);
		return redirect(`/editor/manuscript/${id}?error=操作失败`);
	}
};
