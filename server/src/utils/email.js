// Sending email through Brevo's web API (https://www.brevo.com). It goes over normal HTTPS, so it
// works on hosts that block the email ports (Render's free plan blocks 25, 465 and 587).
//
// Settings (.env): BREVO_API_KEY, EMAIL_FROM (a sender address verified in Brevo) and,
// optionally, EMAIL_FROM_NAME. Without them no email is sent: the server logs a warning instead,
// and in development it prints the email, so the reset link can still be tested locally.

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

function emailConfigured() {
    return Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);
}

// Sends one email. Resolves to true when Brevo accepted it, false when it wasn't sent.
// Never throws: a failed email must not reveal anything to the person asking.
async function sendEmail({ to, toName, subject, text, html }) {
    if (!emailConfigured()) {
        if (process.env.NODE_ENV === "production") console.warn("[email] Not sent: BREVO_API_KEY and EMAIL_FROM are not set.");
        else if (process.env.NODE_ENV !== "test") console.log(`[email] (not configured — showing it here)\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
        return false;
    }
    try {
        const res = await fetch(BREVO_URL, {
            method: "POST",
            headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify({
                sender: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME || "EventInvito" },
                to: [{ email: to, ...(toName && { name: toName }) }],
                subject,
                textContent: text,
                htmlContent: html,
            }),
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
            console.error(`[email] Brevo refused the email (${res.status}): ${(await res.text()).slice(0, 300)}`);
            return false;
        }
        return true;
    } catch (err) {
        console.error(`[email] Could not reach Brevo: ${err.message}`);
        return false;
    }
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// A simple, clean EventInvito email: a heading, a few lines, one button
function layout({ heading, lines, button, footer }) {
    const p = (t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#4a423d">${escapeHtml(t)}</p>`;
    return `<!doctype html><html><body style="margin:0;background:#faf6ef;padding:32px 12px;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ece3d6;border-radius:14px">
<tr><td style="padding:32px 32px 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#2b2625">EventInvito<span style="color:#b8964f">.</span></td></tr>
<tr><td style="padding:8px 32px 28px">
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:24px;color:#2b2625">${escapeHtml(heading)}</h1>
${lines.map(p).join("")}
${button ? `<p style="margin:24px 0"><a href="${escapeHtml(button.href)}" style="display:inline-block;background:#c9a25b;color:#2b2625;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 26px;border-radius:999px">${escapeHtml(button.label)}</a></p>
<p style="margin:0 0 14px;font-size:12px;line-height:1.6;color:#8a7f76">If the button doesn't work, copy this link into your browser:<br><span style="word-break:break-all">${escapeHtml(button.href)}</span></p>` : ""}
${footer ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#8a7f76">${escapeHtml(footer)}</p>` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

module.exports = { sendEmail, emailConfigured, layout };
