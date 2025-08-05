import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client: twilio.Twilio | null = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

export interface SMSMessage {
  to: string;
  message: string;
}

export class SMSService {
  static async sendSMS(params: SMSMessage): Promise<boolean> {
    if (!client || !phoneNumber) {
      console.warn('Twilio not configured, SMS not sent:', params);
      return false;
    }

    try {
      const message = await client.messages.create({
        body: params.message,
        from: phoneNumber,
        to: params.to,
      });

      console.log(`SMS sent with SID: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  static async sendPaymentReminder(phoneNumber: string, groupName: string, amount: string, dueDate: string): Promise<boolean> {
    const message = `MeshFund Reminder: Your contribution of ${amount} for "${groupName}" is due on ${dueDate}. Please make your payment to avoid penalties.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  static async sendPayoutNotification(phoneNumber: string, amount: string, groupName: string): Promise<boolean> {
    const message = `MeshFund: Great news! Your payout of ${amount} from "${groupName}" has been processed. Check your account for details.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  static async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    const message = `Your MeshFund verification code is: ${code}. This code expires in 10 minutes.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }
}
