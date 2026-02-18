// Email sending for Cloudflare Workers.
// Priority:
// 1) Resend REST API (if RESEND_API_KEY is configured)
// 2) MailChannels API (zero-key fallback, requires domain SPF setup)

interface EmailOptions {
	to: string;
	toName?: string;
	from: string;
	fromName?: string;
	subject: string;
	html: string;
	text?: string;
}

function getEmailAddress(input: string): string {
	const m = input.match(/<([^>]+)>/);
	return (m?.[1] || input).trim();
}

async function sendWithResend(options: EmailOptions, apiKey: string): Promise<boolean> {
	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			from: options.fromName ? `${options.fromName} <${options.from}>` : options.from,
			to: [options.toName ? `${options.toName} <${options.to}>` : options.to],
			subject: options.subject,
			html: options.html,
			...(options.text ? { text: options.text } : {}),
		}),
	});

	if (!response.ok) {
		console.error("Resend error:", response.status, await response.text());
		return false;
	}

	return true;
}

async function sendWithMailChannels(options: EmailOptions): Promise<boolean> {
	const fromAddress = getEmailAddress(options.from);
	const fromName = options.fromName || fromAddress;

	const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			personalizations: [
				{
					to: [
						{
							email: options.to,
							...(options.toName ? { name: options.toName } : {}),
						},
					],
				},
			],
			from: {
				email: fromAddress,
				name: fromName,
			},
			subject: options.subject,
			content: [
				{ type: "text/html", value: options.html },
				...(options.text ? [{ type: "text/plain", value: options.text }] : []),
			],
		}),
	});

	if (!response.ok) {
		console.error("MailChannels error:", response.status, await response.text());
		return false;
	}

	return true;
}

export async function sendEmail(options: EmailOptions, apiKey?: string): Promise<boolean> {
	if (apiKey) {
		return sendWithResend(options, apiKey);
	}

	return sendWithMailChannels(options);
}

export function verificationEmailHtml(code: string, siteName: string): string {
	return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Email Verification</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
  <div style="background:#1A2A4A; padding:24px; text-align:center; border-radius:8px 8px 0 0;">
    <h1 style="color:#fff; margin:0; font-size:22px; font-weight:700;">${siteName}</h1>
  </div>
  <div style="background:#ffffff; padding:36px; border:1px solid #ddd; border-top:none;">
    <h2 style="color:#1A2A4A; margin-top:0;">Email Verification Code</h2>
    <p style="color:#444; line-height:1.6;">Thank you for registering with <strong>${siteName}</strong>. Please use the verification code below to complete your registration:</p>
    <div style="background:#1A2A4A; color:#fff; font-size:36px; font-weight:bold; text-align:center; padding:24px; border-radius:8px; letter-spacing:12px; margin:28px 0;">
      ${code}
    </div>
    <p style="color:#666; font-size:0.9rem;">This code is valid for <strong>10 minutes</strong>. Please complete your registration promptly.</p>
    <p style="color:#666; font-size:0.9rem;">If you did not initiate this registration, you can safely ignore this email.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
    <p style="color:#999; font-size:0.8rem;">This is an automated message from ${siteName}. Please do not reply to this email.</p>
  </div>
  <div style="background:#eee; padding:16px; text-align:center; font-size:12px; color:#999; border-radius:0 0 8px 8px;">
    &copy; ${new Date().getFullYear()} ${siteName} &middot; Academic Publishing System
  </div>
</body>
</html>`;
}

export function decisionEmailHtml(
	manuscriptTitle: string,
	decision: string,
	comments: string,
	siteName: string,
	siteUrl: string
): string {
	const decisionMap: Record<string, { label: string; color: string }> = {
		accept: { label: "Accepted for Publication", color: "#2E7D32" },
		revision: { label: "Revision Required", color: "#E65100" },
		reject: { label: "Manuscript Rejected", color: "#C62828" },
	};
	const d = decisionMap[decision] || { label: decision, color: "#666" };

	return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Manuscript Decision Notification</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
  <div style="background:#1A2A4A; padding:24px; text-align:center; border-radius:8px 8px 0 0;">
    <h1 style="color:#fff; margin:0; font-size:22px;">${siteName}</h1>
  </div>
  <div style="background:#ffffff; padding:36px; border:1px solid #ddd; border-top:none;">
    <h2 style="color:#1A2A4A; margin-top:0;">Manuscript Decision Notification</h2>
    <p style="color:#444;">Your manuscript <strong>&ldquo;${manuscriptTitle}&rdquo;</strong> has been reviewed by our editorial team. The decision is as follows:</p>
    <div style="background:${d.color}; color:#fff; font-size:20px; font-weight:bold; text-align:center; padding:18px; border-radius:8px; margin:24px 0;">
      ${d.label}
    </div>
    ${
		comments
			? `<div style="background:#f9f9f9; padding:20px; border-left:4px solid ${d.color}; margin:20px 0; border-radius:0 4px 4px 0;">
      <h3 style="margin-top:0; color:#333; font-size:1rem;">Editorial Comments:</h3>
      <p style="color:#555; line-height:1.6; margin:0;">${comments}</p>
    </div>`
			: ""
	}
    ${
		decision === "revision"
			? `<p style="color:#444;">Please login to view the full reviewer comments and submit your revised manuscript within the specified deadline:</p>
      <div style="text-align:center; margin:20px 0;">
        <a href="${siteUrl}/author" style="background:#1565C0; color:#fff; padding:14px 28px; text-decoration:none; border-radius:6px; display:inline-block; font-weight:600;">Go to Author Dashboard</a>
      </div>`
			: ""
	}
  </div>
  <div style="background:#eee; padding:16px; text-align:center; font-size:12px; color:#999; border-radius:0 0 8px 8px;">
    &copy; ${new Date().getFullYear()} ${siteName} &middot; Academic Publishing System
  </div>
</body>
</html>`;
}
