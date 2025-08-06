"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSService = void 0;
const twilio_1 = __importDefault(require("twilio"));
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
let client = null;
if (accountSid && authToken) {
    client = (0, twilio_1.default)(accountSid, authToken);
}
class SMSService {
    static async sendSMS(params) {
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
        }
        catch (error) {
            console.error('Failed to send SMS:', error);
            return false;
        }
    }
    static async sendPaymentReminder(phoneNumber, groupName, amount, dueDate) {
        const message = `MeshFund Reminder: Your contribution of ${amount} for "${groupName}" is due on ${dueDate}. Please make your payment to avoid penalties.`;
        return this.sendSMS({
            to: phoneNumber,
            message
        });
    }
    static async sendPayoutNotification(phoneNumber, amount, groupName) {
        const message = `MeshFund: Great news! Your payout of ${amount} from "${groupName}" has been processed. Check your account for details.`;
        return this.sendSMS({
            to: phoneNumber,
            message
        });
    }
    static async sendVerificationCode(phoneNumber, code) {
        const message = `Your MeshFund verification code is: ${code}. This code expires in 10 minutes.`;
        return this.sendSMS({
            to: phoneNumber,
            message
        });
    }
}
exports.SMSService = SMSService;
