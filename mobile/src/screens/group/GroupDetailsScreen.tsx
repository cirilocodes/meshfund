import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/colors';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function GroupDetailsScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'activity'>('overview');

  const { currentGroup, loadGroupDetails, isLoading, leaveGroup } = useGroupStore();
  const { user } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      loadGroupDetails(groupId);
    }, [groupId])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadGroupDetails(groupId);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [groupId]);

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(groupId);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleShareGroup = async () => {
    try {
      const result = await Share.share({
        message: `Join my savings group "${currentGroup?.name}" on MeshFund! Group ID: ${groupId}`,
        title: 'Join My Savings Group',
      });
    } catch (error) {
      console.error('Error sharing group:', error);
    }
  };

  const isAdmin = currentGroup?.adminId === user?.id;
  const userMembership = currentGroup?.members.find(m => m.userId === user?.id);

  if (isLoading && !currentGroup) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-secondary">Loading group details...</Text>
      </View>
    );
  }

  if (!currentGroup) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} />
        <Text className="text-xl font-semibold text-primary mt-4 mb-2">
          Group Not Found
        </Text>
        <Text className="text-text-secondary text-center mb-6">
          This group may have been deleted or you don't have access to it.
        </Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="primary"
        />
      </View>
    );
  }

  const renderOverview = () => (
    <View className="space-y-4">
      {/* Group Info */}
      <Card>
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-primary mb-2">
              {currentGroup.name}
            </Text>
            {currentGroup.description && (
              <Text className="text-text-secondary mb-3">
                {currentGroup.description}
              </Text>
            )}
            <View className="flex-row items-center space-x-4">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                <Text className="text-text-secondary text-sm ml-1 capitalize">
                  {currentGroup.frequency}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} />
                <Text className="text-text-secondary text-sm ml-1">
                  {currentGroup.members.length}/{currentGroup.maxMembers}
                </Text>
              </View>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-2xl font-bold text-accent">
              {currentGroup.currency} {currentGroup.contributionAmount}
            </Text>
            <Text className="text-text-secondary text-sm">per cycle</Text>
          </View>
        </View>

        <View className={`px-3 py-2 rounded-full self-start ${
          currentGroup.isLocked ? 'bg-red-100' : 'bg-green-100'
        }`}>
          <Text className={`text-sm font-medium ${
            currentGroup.isLocked ? 'text-red-700' : 'text-green-700'
          }`}>
            {currentGroup.isLocked ? 'Locked' : 'Active'}
          </Text>
        </View>
      </Card>

      {/* Cycle Progress */}
      <Card>
        <Text className="text-lg font-semibold text-primary mb-3">
          Current Cycle: {currentGroup.currentCycle}
        </Text>
        
        <View className="flex-row items-center mb-3">
          <View className="flex-1 bg-gray-100 rounded-full h-3 mr-3">
            <View 
              className="bg-accent h-3 rounded-full"
              style={{ 
                width: `${(currentGroup.contributions.filter(c => c.status === 'paid').length / currentGroup.members.length) * 100}%` 
              }}
            />
          </View>
          <Text className="text-text-secondary text-sm">
            {currentGroup.contributions.filter(c => c.status === 'paid').length}/{currentGroup.members.length}
          </Text>
        </View>

        <Text className="text-text-secondary text-sm">
          {currentGroup.contributions.filter(c => c.status === 'paid').length} of {currentGroup.members.length} members have contributed this cycle
        </Text>
      </Card>

      {/* Quick Actions */}
      <Card>
        <Text className="text-lg font-semibold text-primary mb-4">Quick Actions</Text>
        
        <View className="space-y-3">
          <Button
            title="Make Contribution"
            onPress={() => navigation.navigate('Contributions', { groupId })}
            variant="primary"
            icon={<Ionicons name="wallet" size={20} color="white" />}
          />
          
          {userMembership?.hasReceivedPayout ? (
            <View className="bg-green-50 p-4 rounded-xl">
              <Text className="text-green-700 font-medium text-center">
                ✓ You've already received your payout
              </Text>
            </View>
          ) : (
            <Button
              title="View Payout Status"
              onPress={() => navigation.navigate('Payout', { groupId })}
              variant="outline"
              icon={<Ionicons name="cash-outline" size={20} color={COLORS.primary} />}
            />
          )}
          
          <Button
            title="Share Group"
            onPress={handleShareGroup}
            variant="outline"
            icon={<Ionicons name="share-outline" size={20} color={COLORS.primary} />}
          />
        </View>
      </Card>
    </View>
  );

  const renderMembers = () => (
    <View className="space-y-3">
      {currentGroup.members.map((member, index) => (
        <Card key={member.id}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-3">
                  <Text className="text-white font-semibold">
                    {index + 1}
                  </Text>
                </View>
                <View>
                  <Text className="font-semibold text-primary">
                    Member {index + 1}
                    {member.userId === user?.id && ' (You)'}
                    {member.userId === currentGroup.adminId && ' (Admin)'}
                  </Text>
                  <Text className="text-text-secondary text-sm">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
            
            <View className="items-end">
              <View className="flex-row items-center">
                <Ionicons name="star" size={16} color={COLORS.interactive} />
                <Text className="text-sm ml-1">{member.reputationScore}</Text>
              </View>
              {member.hasReceivedPayout && (
                <Text className="text-green-600 text-xs mt-1">✓ Received payout</Text>
              )}
            </View>
          </View>
        </Card>
      ))}
    </View>
  );

  const renderActivity = () => (
    <View className="space-y-3">
      <Card>
        <View className="items-center py-8">
          <Ionicons name="time-outline" size={48} color={COLORS.textSecondary} />
          <Text className="text-text-secondary text-center mt-2">
            No recent activity
          </Text>
        </View>
      </Card>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          <Text className="text-lg font-semibold text-primary">Group Details</Text>
          
          {isAdmin ? (
            <TouchableOpacity>
              <Ionicons name="settings-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleLeaveGroup}>
              <Ionicons name="exit-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-100">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'members', label: 'Members' },
          { key: 'activity', label: 'Activity' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-4 border-b-2 ${
              activeTab === tab.key ? 'border-primary' : 'border-transparent'
            }`}
          >
            <Text className={`text-center font-medium ${
              activeTab === tab.key ? 'text-primary' : 'text-text-secondary'
            }`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'members' && renderMembers()}
        {activeTab === 'activity' && renderActivity()}
      </ScrollView>
    </View>
  );
}
