// Email sending via Mailchannels (works natively with Cloudflare Workers)
// Requires SPF record: v=spf1 include:relay.mailchannels.net ~all
// And DKIM setup for production use

interface EmailOptions {
	to: string;
	toName?: string;
	from: string;
	fromName?: string;
	subject: string;
	html: string;
	text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
	const payload = {
		personalizations: [
			{
				to: [{ email: options.to, name: options.toName || options.to }],
			},
		],
		from: {
			email: options.from,
			name: options.fromName || "玄学前沿期刊系统",
		},
		subject: options.subject,
		content: [
			...(options.text
				? [{ type: "text/plain", value: options.text }]
				: []),
			{ type: "text/html", value: options.html },
		],
	};

	try {
		const resp = await fetch("https://api.mailchannels.net/tx/v1/send", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		return resp.status === 202;
	} catch {
		console.error("Failed to send email to", options.to);
		return false;
	}
}

export function verificationEmailHtml(code: string, siteName: string): string {
	return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>邮箱验证</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background:#1A2A4A; padding:20px; text-align:center; border-radius:8px 8px 0 0;">
    <h1 style="color:#fff; margin:0; font-size:24px;">${siteName}</h1>
  </div>
  <div style="background:#f9f9f9; padding:30px; border:1px solid #ddd;">
    <h2 style="color:#1A2A4A;">邮箱验证码</h2>
    <p>感谢您注册 ${siteName}。请使用以下验证码完成注册：</p>
    <div style="background:#1A2A4A; color:#fff; font-size:32px; font-weight:bold; text-align:center; padding:20px; border-radius:8px; letter-spacing:8px; margin:20px 0;">
      ${code}
    </div>
    <p style="color:#666;">验证码有效期为 <strong>10分钟</strong>，请尽快完成验证。</p>
    <p style="color:#666;">如果您没有发起此注册请求，请忽略此邮件。</p>
  </div>
  <div style="background:#eee; padding:15px; text-align:center; font-size:12px; color:#999; border-radius:0 0 8px 8px;">
    © ${new Date().getFullYear()} ${siteName} · 学术出版系统
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
		accept: { label: "接受发表", color: "#2E7D32" },
		revision: { label: "修改后重审", color: "#E65100" },
		reject: { label: "拒稿", color: "#C62828" },
	};
	const d = decisionMap[decision] || { label: decision, color: "#666" };

	return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>稿件处理结果通知</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background:#1A2A4A; padding:20px; text-align:center; border-radius:8px 8px 0 0;">
    <h1 style="color:#fff; margin:0; font-size:24px;">${siteName}</h1>
  </div>
  <div style="background:#f9f9f9; padding:30px; border:1px solid #ddd;">
    <h2 style="color:#1A2A4A;">稿件处理结果通知</h2>
    <p>您投递的稿件 <strong>《${manuscriptTitle}》</strong> 已完成编辑审核，结果如下：</p>
    <div style="background:${d.color}; color:#fff; font-size:20px; font-weight:bold; text-align:center; padding:15px; border-radius:8px; margin:20px 0;">
      ${d.label}
    </div>
    ${
		comments
			? `<div style="background:#fff; padding:20px; border-left:4px solid ${d.color}; margin:15px 0;">
      <h3 style="margin-top:0; color:#333;">编辑意见：</h3>
      <p style="color:#555;">${comments}</p>
    </div>`
			: ""
	}
    ${
		decision === "revision"
			? `<p>请登录系统查看详细审稿意见，并在规定时间内提交修改稿：</p>
      <a href="${siteUrl}/author" style="background:#1565C0; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block; margin:10px 0;">前往作者平台</a>`
			: ""
	}
  </div>
  <div style="background:#eee; padding:15px; text-align:center; font-size:12px; color:#999; border-radius:0 0 8px 8px;">
    © ${new Date().getFullYear()} ${siteName} · 学术出版系统
  </div>
</body>
</html>`;
}
