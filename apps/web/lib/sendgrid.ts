import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyToMessageId?: string;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyToMessageId,
}: SendEmailParams): Promise<void> {
  const msg: sgMail.MailDataRequired = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject,
    text,
    html: html ?? formatTextAsHtml(text),
  };

  if (replyToMessageId) {
    msg.headers = {
      'In-Reply-To': replyToMessageId,
      References: replyToMessageId,
    };
  }

  await sgMail.send(msg);
}

function formatTextAsHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div>${escaped}</div>
  <div class="footer">
    Sent by Vibe Planning<br>
    Reply to this email or text us anytime.
  </div>
</body>
</html>`;
}

export function extractEmailAddress(fromHeader: string): string {
  const match = fromHeader.match(/<(.+)>/);
  return match ? match[1] : fromHeader.trim();
}

export function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
