import type { APIRoute } from "astro";

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
	const reviewerId = parseInt(formData.get("reviewer_id") as string || "0");
	const dueDate = formData.get("due_date") as string || null;

	if (!reviewerId) {
		return redirect(`/editor/manuscript/${id}?error=请选择审稿人`);
	}

	try {
		// Verify manuscript belongs to editor's journal
		const manuscript = await env.DB.prepare(
			"SELECT * FROM manuscripts WHERE id = ? AND journal_id = ?"
		).bind(id, user.journalId).first() as any;

		if (!manuscript) {
			return redirect("/editor");
		}

		// Create review assignment
		await env.DB.prepare(`
			INSERT INTO reviews (manuscript_id, reviewer_id, status, due_date)
			VALUES (?, ?, 'assigned', ?)
		`).bind(id, reviewerId, dueDate).run();

		// Update manuscript status
		await env.DB.prepare(
			"UPDATE manuscripts SET status = 'under_review', editor_id = ?, updated_at = datetime('now') WHERE id = ?"
		).bind(user.id, id).run();

		return redirect(`/editor/manuscript/${id}?success=已成功分配审稿人`);
	} catch (err) {
		console.error("Assign error:", err);
		return redirect(`/editor/manuscript/${id}?error=分配失败`);
	}
};
