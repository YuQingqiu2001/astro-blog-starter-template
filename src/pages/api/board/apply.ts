import type { APIRoute } from "astro";
import { uploadFile, generateR2Key } from "../../../lib/r2";

export const POST: APIRoute = async ({ request, locals, redirect }) => {
	const env = locals.runtime?.env;

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return redirect("/join-editorial-board?error=表单解析失败");
	}

	const name = (formData.get("name") as string || "").trim();
	const email = (formData.get("email") as string || "").trim().toLowerCase();
	const affiliation = (formData.get("affiliation") as string || "").trim();
	const journalIdStr = formData.get("journal_id") as string || "";
	const journalId = journalIdStr ? parseInt(journalIdStr) : 0;
	const position = (formData.get("position") as string || "").trim();
	const bio = (formData.get("bio") as string || "").trim();
	const expertise = (formData.get("expertise") as string || "").trim();
	const cvFile = formData.get("cv") as File | null;

	if (!name || !email || !affiliation || !journalId || !bio || !expertise) {
		return redirect("/join-editorial-board?error=missing_fields");
	}

	if (!email.includes("@") || !email.includes(".")) {
		return redirect("/join-editorial-board?error=invalid_email");
	}

	try {
		let cvR2Key: string | null = null;

		// Upload CV if provided
		if (cvFile && cvFile.size > 0 && env?.MANUSCRIPTS_BUCKET) {
			cvR2Key = await generateR2Key(`board-applications/${email}`, cvFile.name);
			await uploadFile(env.MANUSCRIPTS_BUCKET, cvR2Key, cvFile, "application/pdf");
		}

		if (env?.DB) {
			await env.DB.prepare(`
				INSERT INTO board_applications
				(name, email, journal_id, affiliation, position, bio, expertise, cv_r2_key)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			`).bind(name, email, journalId, affiliation, position, bio, expertise, cvR2Key).run();
		}

		return redirect("/join-editorial-board?success=1");
	} catch (err) {
		console.error("Board apply error:", err);
		return redirect("/join-editorial-board?error=提交失败，请稍后重试");
	}
};
