import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const users = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()} AND is_active = true
    `

    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return NextResponse.json({ 
        message: "If an account exists with this email, you will receive a password reset link." 
      })
    }

    const user = users[0]

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store token in database
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}::uuid, ${token}, ${expiresAt.toISOString()})
    `

    // Send email with reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://conecta-re.vercel.app"}/portal/reset-password?token=${token}`

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "noreply@conecta-re.com",
        to: email,
        subject: "Reset Your Password - Conectare",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1C1917; margin: 0; padding: 0; background-color: #FDFBF7;">
              <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1E3A5F 0%, #10294b 100%); padding: 32px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Reset Your Password</h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                  <p style="font-size: 16px; color: #1C1917; margin-bottom: 24px;">
                    We received a request to reset your password. Click the button below to create a new password:
                  </p>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; background: #C9A962; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Reset Password
                    </a>
                  </div>
                  
                  <p style="font-size: 14px; color: #78716C; margin-top: 24px;">
                    This link will expire in 1 hour for security reasons.
                  </p>
                  
                  <p style="font-size: 14px; color: #78716C; margin-top: 16px;">
                    If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                  </p>
                  
                  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #E7E5E4;">
                    <p style="font-size: 12px; color: #A8A29E; margin: 0;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 12px; color: #78716C; word-break: break-all; margin: 8px 0 0 0;">
                      ${resetUrl}
                    </p>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #FDFBF7; padding: 24px; text-align: center; border-top: 1px solid #E7E5E4;">
                  <p style="font-size: 12px; color: #78716C; margin: 0;">
                    © ${new Date().getFullYear()} Conectare. All rights reserved.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      })
    } catch (emailError) {
      console.error("[v0] Failed to send password reset email:", emailError)
      // Continue anyway - don't reveal email send failure
    }

    return NextResponse.json({ 
      message: "If an account exists with this email, you will receive a password reset link." 
    })
  } catch (error) {
    console.error("[v0] Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
