import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { CATEGORIES } from "@/lib/feeds";
import { getRecentArticlesForDigest } from "@/lib/supabase";
import type { Article } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildEmailHtml(grouped: Record<string, Article[]>): string {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categorySections = CATEGORIES.map((cat) => {
    const articles = grouped[cat.id];
    if (!articles || articles.length === 0) return "";

    const rows = articles
      .map(
        (a) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;">
            <a href="${a.link}" style="color:#e8e0d0;text-decoration:none;font-size:15px;font-weight:600;line-height:1.4;">
              ${a.title}
            </a>
            <div style="margin-top:4px;color:#737373;font-size:12px;">
              ${a.source}${a.pub_date ? ` · ${formatDate(a.pub_date)}` : ""}
            </div>
            ${
              a.description
                ? `<div style="margin-top:6px;color:#a8a29e;font-size:13px;line-height:1.6;">${a.description.slice(0, 200)}…</div>`
                : ""
            }
          </td>
        </tr>`
      )
      .join("");

    return `
      <tr>
        <td style="padding: 24px 0 8px 0;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#737373;border-left:3px solid #404040;padding-left:10px;">
            ${cat.label}
          </div>
        </td>
      </tr>
      ${rows}`;
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Daily Feed — ${today}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Georgia,serif;color:#e8e0d0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="border-bottom:1px solid #262626;padding-bottom:24px;margin-bottom:24px;">
              <div style="font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#e8e0d0;">
                Daily Feed
              </div>
              <div style="font-size:13px;color:#737373;margin-top:4px;">${today}</div>
            </td>
          </tr>

          <!-- Articles -->
          ${categorySections}

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0 0;border-top:1px solid #262626;margin-top:24px;">
              <div style="font-size:12px;color:#404040;text-align:center;">
                Your personal daily feed · Delivered every morning
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.DIGEST_TO_EMAIL;
  const fromEmail = process.env.DIGEST_FROM_EMAIL;

  if (!resendKey || !toEmail || !fromEmail) {
    return NextResponse.json({ error: "Missing email env vars" }, { status: 500 });
  }

  const grouped = await getRecentArticlesForDigest();
  const html = buildEmailHtml(grouped);

  const resend = new Resend(resendKey);
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `Daily Feed — ${today}`,
    html,
  });

  if (error) {
    console.error("[digest] Resend error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
