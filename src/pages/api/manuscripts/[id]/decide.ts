import type { APIRoute } from "astro";
import { sendEmail, decisionEmailHtml } from "../../../../lib/email";

export const POST: APIRoute = async ({ request, locals, params, redirect }) => {
	const user = locals.user;
	if (!user || user.role !== "editor") {
		return redirect("/login");
	}

	const id = Number.parseInt(params.id || "", 10);
	if (!id) {
		return redirect("/editor?error=invalid_manuscript");
	}

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
		const manuscript = await env.DB.prepare(`
			SELECT m.*, u.email as submitter_email, u.name as submitter_name
			FROM manuscripts m
			JOIN users u ON m.submitter_id = u.id
			WHERE m.id = ? AND m.journal_id = ?
		`).bind(id, user.journalId).first() as {
			title: string;
			submitter_email: string;
			submitter_name: string;
		} | null;

		if (!manuscript) {
			return redirect("/editor");
		}

		await env.DB.prepare(`
			INSERT INTO editorial_decisions (manuscript_id, editor_id, decision, comments)
			VALUES (?, ?, ?, ?)
		`).bind(id, user.id, decision, comments).run();

		const newStatus = decision === "accept" ? "accepted" : decision === "revision" ? "revision_requested" : "rejected";
		await env.DB.prepare(`
			UPDATE manuscripts
			SET status = ?, editor_id = ?, editor_comment = ?, updated_at = datetime('now')
			WHERE id = ?
		`).bind(newStatus, user.id, comments, id).run();

		const siteUrl = env.SITE_URL || "https://rubbishpublishing.org";
		const siteName = env.SITE_NAME || "Rubbish Publishing Group";
		await sendEmail({
			to: manuscript.submitter_email,
			toName: manuscript.submitter_name,
			from: env.EMAIL_FROM || "noreply@rubbishpublishing.org",
			fromName: siteName,
			subject: `【${siteName}】稿件审理结果通知：《${manuscript.title}》`,
			html: decisionEmailHtml(manuscript.title, decision, comments, siteName, siteUrl),
		}, env.RESEND_API_KEY);

		return redirect(`/editor/manuscript/${id}?success=决定已发送`);
	} catch (err) {
		console.error("Decision error:", err);
		return redirect(`/editor/manuscript/${id}?error=操作失败`);
	}
};
