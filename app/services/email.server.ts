import nodemailer from "nodemailer";

export interface EmailPayload {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export interface NotificationEmailData {
  formName: string;
  submissionId: string;
  submittedAt: string;
  fields: Record<string, string>;
  storeName?: string;
  senderName?: string;
}

export interface AutoResponseEmailData {
  customerEmail: string;
  customerName?: string;
  storeName?: string;
  subject: string;
  body: string;
  senderName?: string;
  replyToEmail?: string;
}

/**
 * Email Service - abstracted email provider
 * Configure SMTP via environment variables
 */
class EmailService {
  private transporter: ReturnType<typeof nodemailer.createTransport> | null =
    null;

  private getTransporter() {
    if (!this.transporter) {
      const host = process.env.SMTP_HOST || "smtp.gmail.com";
      const port = parseInt(process.env.SMTP_PORT || "587");
      const user = process.env.SMTP_USER || "";
      const pass = process.env.SMTP_PASS || "";

      if (!user || !pass) {
        console.warn(
          "[EmailService] SMTP credentials not configured. Emails will be logged only."
        );
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
    return this.transporter;
  }

  async send(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const smtpUser = process.env.SMTP_USER;
      if (!smtpUser) {
        console.log("[EmailService] Would send email:", {
          to: payload.to,
          subject: payload.subject,
        });
        return { success: true };
      }

      const transporter = this.getTransporter();
      const fromName =
        process.env.SMTP_FROM_NAME || "Connect Form";
      const fromEmail =
        process.env.SMTP_USER || "noreply@connectform.app";

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
        cc: payload.cc
          ? Array.isArray(payload.cc)
            ? payload.cc.join(", ")
            : payload.cc
          : undefined,
        bcc: payload.bcc
          ? Array.isArray(payload.bcc)
            ? payload.bcc.join(", ")
            : payload.bcc
          : undefined,
        subject: payload.subject,
        html: payload.html,
        replyTo: payload.replyTo,
      });

      return { success: true };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error";
      console.error("[EmailService] Send failed:", error);
      return { success: false, error };
    }
  }

  buildNotificationEmail(data: NotificationEmailData): string {
    const fieldRows = Object.entries(data.fields)
      .map(
        ([key, value]) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#374151;width:35%;vertical-align:top;">${key}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#6b7280;vertical-align:top;">${value || "—"}</td>
        </tr>`
      )
      .join("");

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">New Form Submission</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${data.storeName || "Your Store"} · ${data.formName}</p>
          </td>
        </tr>
        <!-- Meta Info -->
        <tr>
          <td style="padding:24px 40px 0;">
            <table width="100%" style="background:#f8f9ff;border-radius:8px;padding:16px;border:1px solid #e8e9ff;">
              <tr>
                <td style="font-size:12px;color:#6366f1;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Submission ID</td>
                <td style="font-size:12px;color:#374151;text-align:right;">${data.submissionId}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6366f1;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding-top:8px;">Submitted</td>
                <td style="font-size:12px;color:#374151;text-align:right;padding-top:8px;">${data.submittedAt}</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Fields -->
        <tr>
          <td style="padding:24px 40px;">
            <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Submission Details</h2>
            <table width="100%" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;">
              ${fieldRows}
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:0 40px 32px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;border-top:1px solid #f0f0f0;padding-top:20px;">
              This notification was sent by <strong>Connect Form</strong> for ${data.storeName || "your store"}. 
              Manage your forms and submissions in your Shopify admin.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  buildAutoResponseEmail(data: AutoResponseEmailData): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">${data.storeName || "Thank You!"}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            ${data.customerName ? `<p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi ${data.customerName},</p>` : ""}
            <div style="color:#4b5563;font-size:15px;line-height:1.7;">${data.body.replace(/\n/g, "<br>")}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;border-top:1px solid #f0f0f0;padding-top:20px;">
              Sent by ${data.senderName || "Connect Form"} on behalf of ${data.storeName || "the store"}.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  buildForwardEmail(data: {
    submissionId: string;
    formName: string;
    fields: Record<string, string>;
    customMessage?: string;
    submittedAt: string;
  }): string {
    const fieldRows = Object.entries(data.fields)
      .map(
        ([key, value]) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#374151;width:35%;vertical-align:top;">${key}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#6b7280;">${value || "—"}</td>
        </tr>`
      )
      .join("");

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Fwd: ${data.formName} Submission</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">ID: ${data.submissionId} · ${data.submittedAt}</p>
          </td>
        </tr>
        ${data.customMessage ? `
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="background:#f0f4ff;border-left:3px solid #6366f1;padding:16px;border-radius:4px;color:#374151;font-size:14px;">${data.customMessage}</div>
          </td>
        </tr>` : ""}
        <tr>
          <td style="padding:24px 40px;">
            <table width="100%" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;">
              ${fieldRows}
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}

export const emailService = new EmailService();
