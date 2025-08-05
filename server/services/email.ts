import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.FROM_EMAIL || 'noreply@meshfund.com';

if (apiKey) {
  mailService.setApiKey(apiKey);
}

export interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  static async sendEmail(params: EmailParams): Promise<boolean> {
    if (!apiKey) {
      console.warn('SendGrid not configured, email not sent:', params);
      return false;
    }

    try {
      await mailService.send({
        to: params.to,
        from: fromEmail,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  static async sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
    const subject = 'Welcome to MeshFund!';
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3C3B6E;">Welcome to MeshFund, ${fullName}!</h1>
        <p>Thank you for joining our global savings community. You're now part of a borderless financial network.</p>
        <p>Get started by:</p>
        <ul>
          <li>Completing your profile verification</li>
          <li>Joining your first savings circle</li>
          <li>Inviting trusted friends and family</li>
        </ul>
        <p>Need help? Contact our support team anytime.</p>
        <p style="color: #6B7280;">Best regards,<br>The MeshFund Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  static async sendPaymentReminder(email: string, fullName: string, groupName: string, amount: string, dueDate: string): Promise<boolean> {
    const subject = `Payment Reminder - ${groupName}`;
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3C3B6E;">Payment Reminder</h2>
        <p>Hi ${fullName},</p>
        <p>This is a friendly reminder that your contribution of <strong>${amount}</strong> for "${groupName}" is due on <strong>${dueDate}</strong>.</p>
        <p>Please make your payment on time to maintain your group's schedule and avoid penalties.</p>
        <a href="#" style="background-color: #50C878; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Make Payment</a>
        <p style="color: #6B7280;">Questions? Contact your group admin or our support team.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  static async sendPayoutNotification(email: string, fullName: string, amount: string, groupName: string): Promise<boolean> {
    const subject = `Payout Processed - ${groupName}`;
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #50C878;">Payout Processed!</h2>
        <p>Hi ${fullName},</p>
        <p>Great news! Your payout of <strong>${amount}</strong> from "${groupName}" has been successfully processed.</p>
        <p>The funds should appear in your selected payment method within 1-3 business days.</p>
        <p style="color: #6B7280;">Thank you for being part of MeshFund!</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  static async sendEmailVerification(email: string, fullName: string, verificationCode: string): Promise<boolean> {
    const subject = 'Verify Your Email - MeshFund';
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3C3B6E;">Verify Your Email</h2>
        <p>Hi ${fullName},</p>
        <p>Please verify your email address by entering this code in the app:</p>
        <div style="background-color: #FAF9F6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #3C3B6E; font-size: 32px; letter-spacing: 4px; margin: 0;">${verificationCode}</h1>
        </div>
        <p>This code expires in 10 minutes.</p>
        <p style="color: #6B7280;">If you didn't request this verification, please ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }
}
