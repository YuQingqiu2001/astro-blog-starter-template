export type UserRole = "author" | "editor" | "reviewer";

export type ManuscriptStatus =
	| "submitted"
	| "under_review"
	| "revision_requested"
	| "resubmitted"
	| "accepted"
	| "rejected"
	| "published";

export type ReviewStatus = "assigned" | "in_progress" | "submitted" | "declined";

export type ReviewRecommendation =
	| "accept"
	| "minor_revision"
	| "major_revision"
	| "reject";

export type DecisionType = "accept" | "revision" | "reject";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface Journal {
	id: number;
	name: string;
	nameEn: string;
	slug: string;
	description: string;
	coverImage?: string;
	impactFactor: number;
	issn: string;
	isMain: boolean;
	color: string;
	field: string;
}

export interface User {
	id: number;
	email: string;
	name: string;
	role: UserRole;
	journalId: number | null;
	verified: boolean;
	affiliation?: string;
	bio?: string;
	orcid?: string;
	createdAt: string;
}

export interface EditorialBoardMember {
	id: number;
	userId: number;
	journalId: number;
	position: string;
	isEditorInChief: boolean;
	displayOrder: number;
	// from user join
	name: string;
	email: string;
	affiliation?: string;
	bio?: string;
}

export interface BoardApplication {
	id: number;
	name: string;
	email: string;
	journalId: number;
	journalName?: string;
	affiliation?: string;
	position?: string;
	bio: string;
	expertise?: string;
	cvR2Key?: string;
	status: ApplicationStatus;
	reviewedBy?: number;
	reviewComment?: string;
	createdAt: string;
}

export interface Manuscript {
	id: number;
	title: string;
	abstract?: string;
	authors: string;
	keywords?: string;
	journalId: number;
	journalName?: string;
	submitterId: number;
	submitterName?: string;
	status: ManuscriptStatus;
	r2Key?: string;
	version: number;
	editorId?: number;
	editorComment?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ManuscriptRevision {
	id: number;
	manuscriptId: number;
	version: number;
	r2Key: string;
	responseLetter?: string;
	createdAt: string;
}

export interface Review {
	id: number;
	manuscriptId: number;
	reviewerId: number;
	reviewerName?: string;
	status: ReviewStatus;
	reviewR2Key?: string;
	recommendation?: ReviewRecommendation;
	comments?: string;
	dueDate?: string;
	createdAt: string;
	submittedAt?: string;
}

export interface EditorialDecision {
	id: number;
	manuscriptId: number;
	editorId: number;
	decision: DecisionType;
	comments?: string;
	createdAt: string;
}

export interface PublishedArticle {
	id: number;
	manuscriptId: number;
	journalId: number;
	journalName?: string;
	journalSlug?: string;
	title: string;
	abstract?: string;
	authors: string;
	keywords?: string;
	r2Key: string;
	doi?: string;
	volume?: number;
	issue?: number;
	publishedAt: string;
}

export interface SessionData {
	userId: number;
	email: string;
	name: string;
	role: UserRole;
	journalId: number | null;
}
