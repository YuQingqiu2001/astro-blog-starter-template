import type { APIRoute } from "astro";
import { journals } from "../../../data/journals";
import { generateR2Key, uploadFile } from "../../../lib/r2";
import { getDb, getManuscriptsBucket } from "../../../lib/runtime-env";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i;
const ALLOWED_POSITIONS = new Set([
	"Editorial Board Member",
	"Associate Editor",
	"Guest Editor",
	"Statistical Editor",
	"Section Editor",
]);

function sanitizeOrcid(value: string): string {
	return value.replace(/^https?:\/\/orcid\.org\//i, "").trim();
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
	const env = locals.runtime?.env as Record<string, any> | undefined;
	const db = getDb(env);
	const manuscriptsBucket = getManuscriptsBucket(env);

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return redirect("/join-editorial-board?error=invalid_form");
	}

	const name = ((formData.get("name") as string) || "").trim();
	const email = ((formData.get("email") as string) || "").trim().toLowerCase();
	const affiliation = ((formData.get("affiliation") as string) || "").trim();
	const journalIdStr = (formData.get("journal_id") as string) || "";
	const journalId = journalIdStr ? Number.parseInt(journalIdStr, 10) : Number.NaN;
	const position = ((formData.get("position") as string) || "").trim();
	const bio = ((formData.get("bio") as string) || "").trim();
	const expertise = ((formData.get("expertise") as string) || "").trim();
	const orcid = sanitizeOrcid(((formData.get("orcid") as string) || ""));
	const cvFile = formData.get("cv") as File | null;

	if (!name || !email || !affiliation || !bio || !expertise || !orcid || Number.isNaN(journalId) || journalId <= 0) {
		return redirect("/join-editorial-board?error=missing_fields");
	}

	if (!EMAIL_PATTERN.test(email)) {
		return redirect("/join-editorial-board?error=invalid_email");
	}

	if (!ORCID_PATTERN.test(orcid)) {
		return redirect("/join-editorial-board?error=invalid_orcid");
	}

	if (!ALLOWED_POSITIONS.has(position)) {
		return redirect("/join-editorial-board?error=invalid_position");
	}

	const journalExists = journals.some((journal) => journal.id === journalId);
	if (!journalExists) {
		return redirect("/join-editorial-board?error=invalid_journal");
	}

	if (cvFile && cvFile.size > 0) {
		const isPdf = cvFile.name.toLowerCase().endsWith(".pdf") || cvFile.type === "application/pdf";
		const maxSize = 10 * 1024 * 1024;
		if (!isPdf || cvFile.size > maxSize) {
			return redirect("/join-editorial-board?error=invalid_file");
		}
	}

	if (!db) {
		return redirect("/join-editorial-board?error=service_unavailable");
	}

	try {
		let cvR2Key: string | null = null;

		if (cvFile && cvFile.size > 0) {
			if (!manuscriptsBucket) {
				return redirect("/join-editorial-board?error=service_unavailable");
			}
			cvR2Key = await generateR2Key(`board-applications/${email}`, cvFile.name);
			await uploadFile(manuscriptsBucket, cvR2Key, cvFile, "application/pdf");
		}

		await db.prepare(`
			INSERT INTO board_applications
			(name, email, journal_id, affiliation, position, bio, expertise, orcid, cv_r2_key)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(name, email, journalId, affiliation, position, bio, expertise, orcid, cvR2Key).run();

		return redirect("/join-editorial-board?success=1");
	} catch (error) {
		console.error("Board application submission failed:", error);
		return redirect("/join-editorial-board?error=submission_failed");
	}
};
