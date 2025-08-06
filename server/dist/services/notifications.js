"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const storage_1 = require("../storage");
const email_1 = require("./email");
const sms_1 = require("./sms");
class NotificationService {
    static async createNotification(notification) {
        try {
            await storage_1.storage.createNotification(notification);
            // Send additional notifications based on type
            const user = await storage_1.storage.getUser(notification.userId);
            if (!user)
                return;
            switch (notification.type) {
                case 'payment_reminder':
                    if (user.email) {
                        await email_1.EmailService.sendPaymentReminder(user.email, user.fullName, notification.data?.groupName || 'Unknown Group', notification.data?.amount || '0', notification.data?.dueDate || 'Unknown');
                    }
                    if (user.phoneNumber && user.isPhoneVerified) {
                        await sms_1.SMSService.sendPaymentReminder(user.phoneNumber, notification.data?.groupName || 'Unknown Group', notification.data?.amount || '0', notification.data?.dueDate || 'Unknown');
                    }
                    break;
                case 'payout_success':
                    if (user.email) {
                        await email_1.EmailService.sendPayoutNotification(user.email, user.fullName, notification.data?.amount || '0', notification.data?.groupName || 'Unknown Group');
                    }
                    if (user.phoneNumber && user.isPhoneVerified) {
                        await sms_1.SMSService.sendPayoutNotification(user.phoneNumber, notification.data?.amount || '0', notification.data?.groupName || 'Unknown Group');
                    }
                    break;
            }
        }
        catch (error) {
            console.error('Failed to create notification:', error);
        }
    }
    static async sendPaymentReminders() {
        // This would be called by a cron job to check for due payments
        // and send reminders to users who haven't paid yet
        console.log('Checking for payment reminders...');
        // Implementation would query for contributions due soon
        // and create notifications for users who haven't paid
    }
    static async processPayoutNotifications(groupId, recipientId, amount) {
        const group = await storage_1.storage.getGroup(groupId);
        const recipient = await storage_1.storage.getUser(recipientId);
        if (!group || !recipient)
            return;
        await this.createNotification({
            userId: recipientId,
            type: 'payout_success',
            title: 'Payout Received',
            message: `You received ${amount} ${group.currency} from ${group.name}`,
            data: {
                groupId: groupId,
                groupName: group.name,
                amount: amount
            }
        });
    }
    static async notifyGroupMembers(groupId, title, message, excludeUserId) {
        try {
            const members = await storage_1.storage.getGroupMembers(groupId);
            const group = await storage_1.storage.getGroup(groupId);
            if (!group)
                return;
            for (const member of members) {
                if (excludeUserId && member.userId === excludeUserId)
                    continue;
                await this.createNotification({
                    userId: member.userId,
                    type: 'group_update',
                    title,
                    message,
                    data: {
                        groupId: groupId,
                        groupName: group.name
                    }
                });
            }
        }
        catch (error) {
            console.error('Failed to notify group members:', error);
        }
    }
}
exports.NotificationService = NotificationService;
