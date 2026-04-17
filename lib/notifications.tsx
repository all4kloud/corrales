import { Resend } from 'resend'
import { sql } from './database'

const resend = new Resend(process.env.RESEND_API_KEY)

interface NotifyTaskCompletionParams {
  taskId: string
  taskName: string
  transactionId: string
  customerEmails: string[]
  customerIds: string[]
  propertyAddress?: string
}

/**
 * Send email and in-app notifications when a task is completed
 * Only sends emails to customers who have email_notifications_enabled = true
 */
export async function notifyTaskCompletion({
  taskId,
  taskName,
  transactionId,
  customerEmails,
  customerIds,
  propertyAddress,
}: NotifyTaskCompletionParams) {
  console.log('[v0] notifyTaskCompletion called', { taskId, taskName, transactionId })

  // Get customers with their email preferences
  const customersWithPrefs = await sql`
    SELECT id, email, email_notifications_enabled
    FROM customers
    WHERE id = ANY(${customerIds}::uuid[])
  `

  // Filter customers who have email notifications enabled
  const emailEnabledCustomers = customersWithPrefs.filter(
    (c: any) => c.email_notifications_enabled === true
  )

  const emailsToSend = emailEnabledCustomers.map((c: any) => c.email)

  console.log('[v0] Email preferences check:', {
    totalCustomers: customersWithPrefs.length,
    emailEnabled: emailEnabledCustomers.length,
    emailsToSend,
  })

  // Create in-app notifications for ALL customers (regardless of email preference)
  const notificationPromises = customerIds.map(async (customerId) => {
    try {
      await sql`
        INSERT INTO notifications (
          customer_id,
          type,
          title,
          message,
          link
        ) VALUES (
          ${customerId}::uuid,
          'task_completed',
          'Task Completed',
          ${`${taskName}${propertyAddress ? ` - ${propertyAddress}` : ''} has been completed.`},
          ${`/portal/transactions/${transactionId}`}
        )
      `
    } catch (error) {
      console.error('[v0] Failed to create in-app notification:', error)
    }
  })

  await Promise.all(notificationPromises)

  // Send emails only to customers with email notifications enabled
  if (emailsToSend.length === 0) {
    console.log('[v0] No customers have email notifications enabled, skipping email send')
    return
  }

  const emailPromises = emailsToSend.map(async (email) => {
    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: `Task Completed: ${taskName}`,
        html: generateTaskCompletionEmail({
          taskName,
          propertyAddress,
          transactionId,
        }),
      })
      console.log('[v0] Email sent successfully to', email, result)
    } catch (error) {
      console.error('[v0] Failed to send email to', email, error)
    }
  })

  await Promise.all(emailPromises)
}

function generateTaskCompletionEmail({
  taskName,
  propertyAddress,
  transactionId,
}: {
  taskName: string
  propertyAddress?: string
  transactionId: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Completed</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #1E3A5F 0%, #2c5282 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">✓ Task Completed</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                      Great news! A task for your transaction has been completed.
                    </p>
                    
                    <div style="background-color: #F5F0E8; border-left: 4px solid #C9A962; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <p style="margin: 0 0 10px; color: #1E3A5F; font-size: 18px; font-weight: 600;">
                        ${taskName}
                      </p>
                      ${
                        propertyAddress
                          ? `
                      <p style="margin: 0; color: #78716C; font-size: 14px;">
                        📍 ${propertyAddress}
                      </p>
                      `
                          : ''
                      }
                    </div>
                    
                    <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                      Your transaction is progressing smoothly. You can view all the details and upcoming tasks in your portal.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="margin: 30px 0;">
                      <tr>
                        <td style="border-radius: 6px; background: linear-gradient(135deg, #1E3A5F 0%, #2c5282 100%);">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://conecta-re.vercel.app'}/portal/transactions/${transactionId}" 
                             style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                            View Transaction
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0 0 10px; color: #78716C; font-size: 13px; line-height: 1.5; text-align: center;">
                      This is an automated notification from Transaction Pro
                    </p>
                    <p style="margin: 0; color: #78716C; font-size: 13px; line-height: 1.5; text-align: center;">
                      You can manage your notification preferences in your 
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://conecta-re.vercel.app'}/portal/settings" 
                         style="color: #1E3A5F; text-decoration: underline;">
                        account settings
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}
