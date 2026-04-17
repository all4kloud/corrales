import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { google } from "googleapis"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Connection Failed</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px; background: #fef2f2; }
              .error { color: #dc2626; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              button { background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
              button:hover { background: #b91c1c; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Connection Failed</h1>
              <p>Google Drive authorization was cancelled or failed.</p>
              <p>Error: ${error}</p>
              <button onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    if (!code) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Connection Failed</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px; background: #fef2f2; }
              .error { color: #dc2626; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              button { background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
              button:hover { background: #b91c1c; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Connection Failed</h1>
              <p>No authorization code was provided.</p>
              <button onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Configuration Error</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px; background: #fef2f2; }
              .error { color: #dc2626; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              button { background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
              button:hover { background: #b91c1c; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Configuration Error</h1>
              <p>Google OAuth is not properly configured. Please contact your administrator.</p>
              <button onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

    let tokens
    try {
      const response = await oauth2Client.getToken(code)
      tokens = response.tokens
    } catch (tokenError: unknown) {
      const errorMessage = tokenError instanceof Error ? tokenError.message : "Token exchange failed"
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Connection Failed</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px; background: #fef2f2; }
              .error { color: #dc2626; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              button { background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
              button:hover { background: #b91c1c; }
              .details { font-size: 12px; color: #666; margin-top: 10px; word-break: break-all; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Connection Failed</h1>
              <p>Failed to exchange authorization code for access token.</p>
              <p class="details">${errorMessage}</p>
              <button onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    if (!tokens.access_token) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Connection Failed</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px; background: #fef2f2; }
              .error { color: #dc2626; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              button { background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
              button:hover { background: #b91c1c; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Connection Failed</h1>
              <p>No access token was received from Google.</p>
              <button onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000)

    // Store credentials in database
    await sql`
      INSERT INTO google_drive_credentials (
        user_id, 
        access_token, 
        refresh_token, 
        expires_at
      ) VALUES (
        'system',
        ${tokens.access_token},
        ${tokens.refresh_token || null},
        ${expiresAt}
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        access_token = ${tokens.access_token},
        refresh_token = COALESCE(${tokens.refresh_token}, google_drive_credentials.refresh_token),
        expires_at = ${expiresAt},
        updated_at = CURRENT_TIMESTAMP
    `

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Google Drive Connected</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px; background: #f0fdf4; }
            .success { color: #16a34a; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .checkmark { font-size: 64px; margin-bottom: 20px; }
            button { background: #16a34a; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
            button:hover { background: #15803d; }
            .countdown { color: #666; font-size: 14px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">✓</div>
            <h1 class="success">Google Drive Connected!</h1>
            <p>Your Google Drive integration is now active.</p>
            <p class="countdown">This window will close automatically in <span id="countdown">5</span> seconds...</p>
            <button onclick="closeWindow()">Close Now</button>
          </div>
          <script>
            let seconds = 5;
            const countdownEl = document.getElementById('countdown');
            
            // Notify opener window that connection is complete
            if (window.opener && !window.opener.closed) {
              try {
                window.opener.postMessage({ type: 'google-drive-connected', success: true }, '*');
              } catch (e) {
                console.log('Could not post message to opener');
              }
            }
            
            function closeWindow() {
              window.close();
              // Fallback if window.close() doesn't work (some browsers block it)
              setTimeout(() => {
                document.body.innerHTML = '<div class="container"><h1 class="success">Connected!</h1><p>You can safely close this tab and return to the application.</p></div>';
              }, 100);
            }
            
            const interval = setInterval(() => {
              seconds--;
              countdownEl.textContent = seconds;
              if (seconds <= 0) {
                clearInterval(interval);
                closeWindow();
              }
            }, 1000);
          </script>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } },
    )
  } catch (error) {
    console.error("Error in Google Drive callback:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Connection Error</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px; background: #fef2f2; }
            .error { color: #dc2626; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            button { background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
            button:hover { background: #b91c1c; }
            .details { font-size: 12px; color: #666; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Connection Error</h1>
            <p>An unexpected error occurred while connecting to Google Drive.</p>
            <p class="details">${errorMessage}</p>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } },
    )
  }
}
