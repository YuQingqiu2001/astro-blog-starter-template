import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, params, redirect }) => {
	const user = locals.user;
	if (!user || user.role !== "reviewer") {
		return redirect("/login");
	}

	const id = parseInt(params.id!);
	const env = locals.runtime?.env;
	if (!env?.DB) {
		return redirect("/reviewer?error=服务暂时不可用");
	}

	try {
		await env.DB.prepare(
			"UPDATE reviews SET status = 'declined' WHERE manuscript_id = ? AND reviewer_id = ?"
		).bind(id, user.id).run();

		return redirect("/reviewer?success=已婉拒审稿邀请");
	} catch (err) {
		return redirect("/reviewer?error=操作失败");
	}
};
