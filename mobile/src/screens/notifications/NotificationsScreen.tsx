import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants/colors';
import Card from '../../components/ui/Card';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'payment_reminder' | 'payout_success' | 'group_update' | 'dispute';
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Mock notifications for demonstration
  useEffect(() => {
    setNotifications([
      {
        id: '1',
        title: 'Payment Reminder',
        message: 'Your monthly contribution for Family Vacation Fund is due tomorrow',
        type: 'payment_reminder',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Payout Received',
        message: 'You received $600 from Wedding Savings Circle',
        type: 'payout_success',
        isRead: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        title: 'New Member Joined',
        message: 'Sarah Johnson joined your Family Vacation Fund group',
        type: 'group_update',
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        title: 'Cycle Complete',
        message: 'All contributions received for this cycle in Business Investment Circle',
        type: 'group_update',
        isRead: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return 'time-outline';
      case 'payout_success':
        return 'cash-outline';
      case 'group_update':
        return 'people-outline';
      case 'dispute':
        return 'warning-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return COLORS.warning;
      case 'payout_success':
        return COLORS.success;
      case 'group_update':
        return COLORS.info;
      case 'dispute':
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: COLORS.background }}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={{ padding: 24 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.primary }}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={{
                backgroundColor: COLORS.primary + '10',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="notifications-off-outline" size={64} color={COLORS.textSecondary} />
              <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.primary, marginTop: 16, marginBottom: 8 }}>
                No Notifications
              </Text>
              <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>
                You're all caught up! Notifications will appear here when you have updates.
              </Text>
            </View>
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                onPress={() => markAsRead(notification.id)}
              >
                <Card style={{
                  backgroundColor: notification.isRead ? COLORS.surface : COLORS.primary + '05',
                  borderLeftWidth: 4,
                  borderLeftColor: notification.isRead ? 'transparent' : getNotificationColor(notification.type),
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: getNotificationColor(notification.type) + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Ionicons 
                        name={getNotificationIcon(notification.type) as any}
                        size={20} 
                        color={getNotificationColor(notification.type)} 
                      />
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: notification.isRead ? '500' : '600',
                          color: COLORS.textPrimary,
                          flex: 1,
                        }}>
                          {notification.title}
                        </Text>
                        
                        <Text style={{
                          fontSize: 12,
                          color: COLORS.textSecondary,
                          marginLeft: 8,
                        }}>
                          {formatRelativeTime(notification.createdAt)}
                        </Text>
                      </View>
                      
                      <Text style={{
                        fontSize: 14,
                        color: COLORS.textSecondary,
                        lineHeight: 20,
                      }}>
                        {notification.message}
                      </Text>
                      
                      {!notification.isRead && (
                        <View style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: COLORS.primary,
                          position: 'absolute',
                          top: 0,
                          right: 0,
                        }} />
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Settings */}
        <Card style={{ marginTop: 24 }}>
          <TouchableOpacity style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginLeft: 12 }}>
                Notification Settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
}