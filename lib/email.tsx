import { Resend } from "resend"

export interface EmailAttachment {
  filename: string
  content: Buffer | string // Buffer for binary, base64 string
}

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  reply_to?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: EmailAttachment[]
}

interface EmailResult {
  success: boolean
  data?: any
  error?: string
}

const APP_URL = process.env.NEXTAUTH_URL || "https://conecta-re.vercel.app"

/**
 * Wraps any email body HTML with the Conecta branded header and footer.
 * The logo is loaded from the public URL so email clients can render it.
 */
export function wrapEmailHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#10294b;padding:24px 32px;text-align:center;">
              <img
                src="${APP_URL}/conecta-logo.png"
                alt="Conecta"
                width="140"
                style="display:inline-block;max-width:140px;height:auto;"
              />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;color:#1c1917;font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#10294b;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#c9a962;font-size:13px;font-weight:600;letter-spacing:0.05em;">
                CONECTA REAL ESTATE
              </p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;">
                Puede responder directamente a este correo para contactar al agente.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] RESEND_API_KEY is not configured")
      return {
        success: false,
        error: "Email service not configured - RESEND_API_KEY missing",
      }
    }

    if (!process.env.RESEND_FROM_EMAIL && !options.from) {
      console.error("[v0] RESEND_FROM_EMAIL is not configured")
      return {
        success: false,
        error: "Email service not configured - RESEND_FROM_EMAIL missing",
      }
    }

    const toArray = Array.isArray(options.to) ? options.to : [options.to]

    const resend = new Resend(process.env.RESEND_API_KEY)

    const ccArray = options.cc
      ? (Array.isArray(options.cc) ? options.cc : [options.cc])
      : undefined

    const bccArray = options.bcc
      ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc])
      : undefined

    const { data, error } = await resend.emails.send({
      from: options.from || process.env.RESEND_FROM_EMAIL!,
      to: toArray,
      ...(options.reply_to ? { reply_to: options.reply_to } : {}),
      ...(ccArray  && ccArray.length  > 0 ? { cc:  ccArray  } : {}),
      ...(bccArray && bccArray.length > 0 ? { bcc: bccArray } : {}),
      subject: options.subject,
      html: options.html,
      ...(options.attachments && options.attachments.length > 0
        ? {
            attachments: options.attachments.map((a) => ({
              filename: a.filename,
              content: a.content,
            })),
          }
        : {}),
    })

    if (error) {
      console.error("[v0] Resend API error:", error)
      return {
        success: false,
        error: error.message || "Failed to send email",
      }
    }

    console.log("[v0] Email sent successfully via Resend, ID:", data?.id)
    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("[v0] Error in sendEmail:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

export async function sendPasswordResetEmail(to: string, resetCode: string, userName: string): Promise<EmailResult> {
  console.log("[v0] Preparing password reset email for:", to)
  console.log("[v0] Reset code:", resetCode)

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #10294b; padding: 20px; text-align: center;">
          <h1 style="color: #e8a522; margin: 0;">Conectare</h1>
        </div>
        <div style="padding: 30px; background-color: #f8f7f7;">
          <h2 style="color: #10294b;">Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>You requested to reset your password. Use the code below to reset your password:</p>
          <div style="background-color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; border: 2px solid #e8a522;">
            <h1 style="color: #10294b; font-size: 32px; letter-spacing: 5px; margin: 0;">${resetCode}</h1>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">This is an automated message from Conectare. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to,
    subject: "Password Reset Code - Conectare",
    html,
  })
}
