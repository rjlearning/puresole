import { Resend } from 'resend';

// Initialize the Resend client with your API key
// We use the environment variable if available, otherwise fallback to the provided test key
const resendApiKey = process.env.RESEND_API_KEY || 're_bmzZgW8V_v4pLQzeyjkVadjhc8dZsecYQ';
const resend = new Resend(resendApiKey);

// If you haven't verified a custom domain on Resend yet, you MUST send from onboarding@resend.dev
export const defaultFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Send a welcome email to a new user.
 */
export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const data = await resend.emails.send({
      from: defaultFromEmail,
      // If you are using the testing domain (onboarding@resend.dev), Resend ONLY allows sending to your own verified email address.
      // So if you get errors sending to external addresses, you either need to verify a domain, or hardcode the 'to' address here for testing.
      to: [to],
      subject: "Welcome to PureSoul",
      html: `
        <div style="font-family: sans-serif; max-w-xl; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Welcome to PureSoul, ${name}</h2>
          <p>We're excited to support your journey to better self-awareness and wellness.</p>
          <p>Log in now to record your first Voice Biomarker or start a daily check-in.</p>
          <br/>
          <p><strong>Live well, live long.</strong></p>
          <p>- The PureSoul Team</p>
        </div>
      `,
    });

    console.log("Email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    return false;
  }
}
/**
 * Send a password reset email to a user.
 */
export async function sendPasswordResetEmail(to: string, token: string) {
  try {
    // Generate the reset link - handle both production and development URLs
    const appUrl = process.env.APP_URL || (process.env.NODE_ENV === 'production'
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : 'http://localhost:5000');

    // We use /auth?mode=reset&token=xxx for a unified auth page experience
    const resetLink = `${appUrl}/auth?mode=reset&token=${token}`;

    const data = await resend.emails.send({
      from: defaultFromEmail,
      to: [to],
      subject: "Reset your PureSoul password",
      html: `
        <div style="font-family: sans-serif; max-w-xl; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">PureSoul Password Recovery</h2>
          <p>We received a request to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; rounded: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="font-size: 0.9em; color: #666;">If you didn't request this, you can safely ignore this email.</p>
          <br/>
          <p>- The PureSoul Team</p>
        </div>
      `,
    });

    console.log("Password reset email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Failed to send reset email:", error);
    return false;
  }
}
