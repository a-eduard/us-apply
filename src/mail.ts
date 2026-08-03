import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload) {
  try {
    const info = await transporter.sendMail({
      from: `"ApplyPlatform" <${process.env.SMTP_USER}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    console.log("Email sent successfully: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendApplicationConfirmation(to: string, candidateName: string, campaignTitle: string) {
  const subject = `Application Received: ${campaignTitle}`;
  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
      <h2>Hello ${candidateName},</h2>
      <p>We have successfully received your application for the <strong>${campaignTitle}</strong> position.</p>
      <p>You can track your application status in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/candidate">Candidate Dashboard</a>.</p>
      <p>Best regards,<br/>ApplyPlatform Team</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

export async function sendEmployerNotification(to: string, employerName: string, campaignTitle: string, candidateName: string) {
  const subject = `New Application: ${campaignTitle}`;
  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
      <h2>Hello ${employerName},</h2>
      <p>You have received a new application from <strong>${candidateName}</strong> for your campaign: <strong>${campaignTitle}</strong>.</p>
      <p>Please log in to your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/employer">Employer Dashboard</a> to review their profile and update their status.</p>
      <p>Best regards,<br/>ApplyPlatform Team</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

export async function sendInterviewInvite(to: string, candidateName: string, campaignTitle: string, calendlyUrl: string) {
  const subject = `Interview Invitation: ${campaignTitle}`;
  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
      <h2>Hello ${candidateName},</h2>
      <p>Congratulations! You have been moved to the interview stage for the <strong>${campaignTitle}</strong> position.</p>
      <p>Please schedule your interview using the following link:</p>
      <p><a href="${calendlyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 5px;">Schedule Interview</a></p>
      <p>Best regards,<br/>ApplyPlatform Team</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}