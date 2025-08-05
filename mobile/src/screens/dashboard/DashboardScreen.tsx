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

import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { COLORS } from '../../constants/colors';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function DashboardScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuthStore();
  const { groups, loadUserGroups, isLoading } = useGroupStore();

  useFocusEffect(
    useCallback(() => {
      loadUserGroups();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadUserGroups();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getTotalBalance = () => {
    return groups.reduce((total, group) => {
      // In a real app, this would calculate based on actual contributions and payouts
      return total + parseFloat(group.contributionAmount) * group.currentCycle;
    }, 0);
  };

  const getUpcomingPayments = () => {
    return groups.filter(group => !group.isLocked).length;
  };

  return (
    <ScrollView 
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-lg text-text-secondary">
              {getGreeting()},
            </Text>
            <Text className="text-2xl font-bold text-primary">
              {user?.fullName?.split(' ')[0] || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View className="flex-row space-x-4">
          <Card className="flex-1 bg-primary">
            <Text className="text-white text-sm opacity-80">Total Saved</Text>
            <Text className="text-white text-2xl font-bold">
              ${getTotalBalance().toFixed(2)}
            </Text>
          </Card>
          
          <Card className="flex-1 bg-accent">
            <Text className="text-white text-sm opacity-80">Active Groups</Text>
            <Text className="text-white text-2xl font-bold">
              {groups.length}
            </Text>
          </Card>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 mb-6">
        <Text className="text-xl font-semibold text-primary mb-4">Quick Actions</Text>
        <View className="flex-row space-x-4">
          <TouchableOpacity 
            className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm border border-gray-100"
            onPress={() => navigation.navigate('Groups')}
          >
            <View className="w-12 h-12 bg-primary rounded-full items-center justify-center mb-2">
              <Ionicons name="add" size={24} color="white" />
            </View>
            <Text className="text-primary font-medium">Create Group</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm border border-gray-100"
            onPress={() => navigation.navigate('Contributions')}
          >
            <View className="w-12 h-12 bg-accent rounded-full items-center justify-center mb-2">
              <Ionicons name="wallet" size={20} color="white" />
            </View>
            <Text className="text-primary font-medium">Make Payment</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* My Groups */}
      <View className="px-6 mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-semibold text-primary">My Groups</Text>
          {groups.length > 0 && (
            <TouchableOpacity>
              <Text className="text-primary font-medium">View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <Card>
            <Text className="text-text-secondary text-center">Loading groups...</Text>
          </Card>
        ) : groups.length === 0 ? (
          <Card>
            <View className="items-center py-8">
              <Ionicons name="people-outline" size={48} color={COLORS.textSecondary} />
              <Text className="text-xl font-semibold text-primary mt-4 mb-2">
                No Groups Yet
              </Text>
              <Text className="text-text-secondary text-center mb-6">
                Start your savings journey by creating or joining a group
              </Text>
              <Button
                title="Create Your First Group"
                onPress={() => navigation.navigate('Groups')}
                variant="primary"
              />
            </View>
          </Card>
        ) : (
          <View className="space-y-3">
            {groups.slice(0, 3).map((group) => (
              <TouchableOpacity
                key={group.id}
                onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
              >
                <Card>
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-primary mb-1">
                        {group.name}
                      </Text>
                      <Text className="text-text-secondary text-sm">
                        Cycle {group.currentCycle} • {group.frequency}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-accent">
                        ${group.contributionAmount}
                      </Text>
                      <Text className="text-text-secondary text-sm">
                        {group.currency}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center">
                    <View className="flex-1 bg-gray-100 rounded-full h-2 mr-3">
                      <View 
                        className="bg-accent h-2 rounded-full"
                        style={{ width: `${(group.currentCycle / group.maxMembers) * 100}%` }}
                      />
                    </View>
                    <Text className="text-text-secondary text-sm">
                      {group.currentCycle}/{group.maxMembers}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Recent Activity */}
      <View className="px-6 pb-6">
        <Text className="text-xl font-semibold text-primary mb-4">Recent Activity</Text>
        <Card>
          <View className="items-center py-6">
            <Ionicons name="time-outline" size={32} color={COLORS.textSecondary} />
            <Text className="text-text-secondary text-center mt-2">
              No recent activity
            </Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
