import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { apiClient } from '../../services/api';
import { COLORS } from '../../constants/colors';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface Notification {
  id: string;
  userId: string;
  groupId?: string;
  type: 'payment_reminder' | 'payout_success' | 'group_update' | 'dispute';
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [filter])
  );

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ notifications: Notification[] }>(
        `/notifications${filter === 'unread' ? '?unread=true' : ''}`
      );
      
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotifications();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [filter]);

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // This would need to be implemented in the backend
      await apiClient.patch('/notifications/mark-all-read');
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'payment_reminder':
        if (notification.groupId) {
          navigation.navigate('Contributions', { groupId: notification.groupId });
        }
        break;
      case 'payout_success':
        if (notification.groupId) {
          navigation.navigate('Payout', { groupId: notification.groupId });
        }
        break;
      case 'group_update':
        if (notification.groupId) {
          navigation.navigate('GroupDetails', { groupId: notification.groupId });
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return 'wallet-outline';
      case 'payout_success':
        return 'cash-outline';
      case 'group_update':
        return 'people-outline';
      case 'dispute':
        return 'alert-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return COLORS.interactive;
      case 'payout_success':
        return COLORS.accent;
      case 'group_update':
        return COLORS.primary;
      case 'dispute':
        return '#EF4444';
      default:
        return COLORS.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) { // 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-primary">Notifications</Text>
          
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text className="text-primary font-medium">Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Tabs */}
        <View className="flex-row mt-4 space-x-4">
          <TouchableOpacity
            onPress={() => setFilter('all')}
            className={`px-4 py-2 rounded-full ${
              filter === 'all' ? 'bg-primary' : 'bg-gray-100'
            }`}
          >
            <Text className={`font-medium ${
              filter === 'all' ? 'text-white' : 'text-gray-600'
            }`}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setFilter('unread')}
            className={`px-4 py-2 rounded-full flex-row items-center ${
              filter === 'unread' ? 'bg-primary' : 'bg-gray-100'
            }`}
          >
            <Text className={`font-medium ${
              filter === 'unread' ? 'text-white' : 'text-gray-600'
            }`}>
              Unread
            </Text>
            {unreadCount > 0 && (
              <View className={`ml-2 px-2 py-1 rounded-full ${
                filter === 'unread' ? 'bg-white' : 'bg-primary'
              }`}>
                <Text className={`text-xs font-bold ${
                  filter === 'unread' ? 'text-primary' : 'text-white'
                }`}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {isLoading ? (
          <Card>
            <Text className="text-text-secondary text-center">Loading notifications...</Text>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <View className="items-center py-12">
              <Ionicons name="notifications-outline" size={64} color={COLORS.textSecondary} />
              <Text className="text-xl font-semibold text-primary mt-4 mb-2">
                {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
              </Text>
              <Text className="text-text-secondary text-center">
                {filter === 'unread' 
                  ? 'All caught up! No new notifications to read.'
                  : 'You\'ll receive notifications about payments, payouts, and group updates here.'
                }
              </Text>
            </View>
          </Card>
        ) : (
          <View className="space-y-3">
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
              >
                <Card className={`${
                  !notification.isRead ? 'border-l-4 border-l-primary bg-blue-50' : ''
                }`}>
                  <View className="flex-row items-start">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      !notification.isRead ? 'bg-primary' : 'bg-gray-100'
                    }`}>
                      <Ionicons
                        name={getNotificationIcon(notification.type) as any}
                        size={20}
                        color={!notification.isRead ? 'white' : getNotificationColor(notification.type)}
                      />
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between mb-1">
                        <Text className={`text-base font-semibold ${
                          !notification.isRead ? 'text-primary' : 'text-gray-800'
                        }`}>
                          {notification.title}
                        </Text>
                        <Text className="text-text-secondary text-xs">
                          {formatDate(notification.createdAt)}
                        </Text>
                      </View>
                      
                      <Text className="text-text-secondary text-sm leading-5">
                        {notification.message}
                      </Text>
                      
                      {!notification.isRead && (
                        <View className="w-2 h-2 bg-primary rounded-full mt-2" />
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
