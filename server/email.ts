import nodemailer from 'nodemailer';

// Create a reusable transporter object using the default SMTP transport
// This relies on environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)
// which should be configured in your Railway dashboard or local .env file.
export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const defaultFromEmail = process.env.SMTP_FROM || '"PureSoul" <hello@puresoul.com>';

/**
 * Send a welcome email to a new user.
 */
export async function sendWelcomeEmail(to: string, name: string) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.warn('⚠️ SMTP credentials not configured. Skipping welcome email to:', to);
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: defaultFromEmail,
            to,
            subject: "Welcome to PureSoul",
            text: `Hi ${name},\n\nWelcome to PureSoul. We're excited to support your journey to better self-awareness.\n\nLive well, live long.\n\nThe PureSoul Team`,
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
        console.log("Email sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Failed to send email:", error);
        return false;
    }
}
