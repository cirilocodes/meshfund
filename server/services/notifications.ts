import { storage } from '../storage';
import { EmailService } from './email';
import { SMSService } from './sms';
import type { InsertNotification } from '../schema';

export class NotificationService {
  static async createNotification(notification: InsertNotification): Promise<void> {
    try {
      await storage.createNotification(notification);
      
      // Send additional notifications based on type
      const user = await storage.getUser(notification.userId);
      if (!user) return;

      switch (notification.type) {
        case 'payment_reminder':
          if (user.email) {
            await EmailService.sendPaymentReminder(
              user.email,
              user.fullName,
              notification.data?.groupName || 'Unknown Group',
              notification.data?.amount || '0',
              notification.data?.dueDate || 'Unknown'
            );
          }
          if (user.phoneNumber && user.isPhoneVerified) {
            await SMSService.sendPaymentReminder(
              user.phoneNumber,
              notification.data?.groupName || 'Unknown Group',
              notification.data?.amount || '0',
              notification.data?.dueDate || 'Unknown'
            );
          }
          break;

        case 'payout_success':
          if (user.email) {
            await EmailService.sendPayoutNotification(
              user.email,
              user.fullName,
              notification.data?.amount || '0',
              notification.data?.groupName || 'Unknown Group'
            );
          }
          if (user.phoneNumber && user.isPhoneVerified) {
            await SMSService.sendPayoutNotification(
              user.phoneNumber,
              notification.data?.amount || '0',
              notification.data?.groupName || 'Unknown Group'
            );
          }
          break;
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  static async sendPaymentReminders(): Promise<void> {
    // This would be called by a cron job to check for due payments
    // and send reminders to users who haven't paid yet
    console.log('Checking for payment reminders...');
    
    // Implementation would query for contributions due soon
    // and create notifications for users who haven't paid
  }

  static async processPayoutNotifications(groupId: string, recipientId: string, amount: string): Promise<void> {
    const group = await storage.getGroup(groupId);
    const recipient = await storage.getUser(recipientId);
    
    if (!group || !recipient) return;

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

  static async notifyGroupMembers(
    groupId: string, 
    title: string, 
    message: string, 
    excludeUserId?: string
  ): Promise<void> {
    try {
      const members = await storage.getGroupMembers(groupId);
      const group = await storage.getGroup(groupId);
      
      if (!group) return;

      for (const member of members) {
        if (excludeUserId && member.userId === excludeUserId) continue;
        
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
    } catch (error) {
      console.error('Failed to notify group members:', error);
    }
  }
}