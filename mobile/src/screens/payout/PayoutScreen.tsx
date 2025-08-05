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

import { ContributionService, Payout } from '../../services/contributions';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/colors';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function PayoutScreen({ route, navigation }: any) {
  const { groupId } = route.params || {};
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(groupId || null);

  const { groups, loadUserGroups, currentGroup, loadGroupDetails } = useGroupStore();
  const { user } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedGroup])
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      await loadUserGroups();
      const userPayouts = await ContributionService.getUserPayouts();
      setPayouts(userPayouts);
      
      if (selectedGroup) {
        await loadGroupDetails(selectedGroup);
      }
    } catch (error) {
      console.error('Failed to load payouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [selectedGroup]);

  const handleRequestPayout = async (group: any) => {
    // Check if user is eligible for payout
    const userMembership = currentGroup?.members.find(m => m.userId === user?.id);
    
    if (userMembership?.hasReceivedPayout) {
      Alert.alert(
        'Already Received',
        'You have already received your payout for this group.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Request Payout',
      `Request your payout of ${group.contributionAmount} ${group.currency}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              setIsLoading(true);
              await ContributionService.requestPayout(group.id, 'default');
              
              Alert.alert(
                'Success',
                'Payout request submitted successfully!',
                [{ text: 'OK', onPress: () => loadData() }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to request payout');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const getPayoutStatus = (group: any) => {
    const userPayout = payouts.find(p => p.groupId === group.id && p.userId === user?.id);
    
    if (!userPayout) {
      const userMembership = currentGroup?.members.find(m => m.userId === user?.id);
      
      if (userMembership?.hasReceivedPayout) {
        return { status: 'completed', color: 'text-green-600', bg: 'bg-green-100' };
      }
      
      return { status: 'not_requested', color: 'text-gray-600', bg: 'bg-gray-100' };
    }

    switch (userPayout.status) {
      case 'completed':
        return { status: 'completed', color: 'text-green-600', bg: 'bg-green-100' };
      case 'pending':
        return { status: 'pending', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'failed':
        return { status: 'failed', color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { status: 'unknown', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const calculateTotalPayout = (group: any) => {
    return parseFloat(group.contributionAmount) * group.maxMembers;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
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
        <Text className="text-2xl font-bold text-primary mb-6">Payouts</Text>

        {/* Group Selection */}
        {!groupId && (
          <Card className="mb-6">
            <Text className="text-lg font-semibold text-primary mb-3">Select Group</Text>
            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity
                onPress={() => setSelectedGroup(null)}
                className={`px-4 py-2 rounded-full border ${
                  selectedGroup === null
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`}
              >
                <Text className={`${
                  selectedGroup === null ? 'text-white' : 'text-gray-700'
                }`}>
                  All Groups
                </Text>
              </TouchableOpacity>
              
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => setSelectedGroup(group.id)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedGroup === group.id
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  }`}
                >
                  <Text className={`${
                    selectedGroup === group.id ? 'text-white' : 'text-gray-700'
                  }`}>
                    {group.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Available Payouts */}
        <Card className="mb-6">
          <Text className="text-lg font-semibold text-primary mb-4">
            Available Payouts
          </Text>
          
          {isLoading ? (
            <Text className="text-text-secondary">Loading...</Text>
          ) : groups.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="people-outline" size={48} color={COLORS.textSecondary} />
              <Text className="text-text-secondary text-center mt-2">
                No groups joined yet
              </Text>
              <Button
                title="Join a Group"
                onPress={() => navigation.navigate('Groups')}
                variant="primary"
                size="small"
                className="mt-4"
              />
            </View>
          ) : (
            <View className="space-y-3">
              {groups
                .filter(group => selectedGroup === null || group.id === selectedGroup)
                .map((group) => {
                  const statusInfo = getPayoutStatus(group);
                  const totalPayout = calculateTotalPayout(group);
                  
                  return (
                    <View
                      key={group.id}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-1">
                          <Text className="text-lg font-semibold text-primary">
                            {group.name}
                          </Text>
                          <Text className="text-text-secondary text-sm">
                            Cycle {group.currentCycle} • {group.frequency}
                          </Text>
                          <Text className="text-text-secondary text-sm">
                            Total Pool: {group.currency} {totalPayout.toFixed(2)}
                          </Text>
                        </View>
                        
                        <View className="items-end">
                          <Text className="text-xl font-bold text-accent">
                            {group.currency} {totalPayout.toFixed(2)}
                          </Text>
                          <View className={`px-3 py-1 rounded-full ${statusInfo.bg} mt-1`}>
                            <Text className={`text-xs font-medium capitalize ${statusInfo.color}`}>
                              {statusInfo.status.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* Payout Queue Position */}
                      {selectedGroup === group.id && currentGroup && (
                        <View className="bg-gray-50 rounded-lg p-3 mb-3">
                          <Text className="text-sm font-medium text-primary mb-2">
                            Payout Queue
                          </Text>
                          <View className="space-y-2">
                            {currentGroup.members
                              .sort((a, b) => (a.payoutPosition || 0) - (b.payoutPosition || 0))
                              .map((member, index) => (
                                <View key={member.id} className="flex-row items-center justify-between">
                                  <Text className={`text-sm ${
                                    member.userId === user?.id ? 'font-semibold text-primary' : 'text-gray-600'
                                  }`}>
                                    {index + 1}. {member.userId === user?.id ? 'You' : `Member ${index + 1}`}
                                  </Text>
                                  {member.hasReceivedPayout && (
                                    <Text className="text-green-600 text-xs">✓ Received</Text>
                                  )}
                                </View>
                              ))}
                          </View>
                        </View>
                      )}
                      
                      {statusInfo.status === 'not_requested' && (
                        <Button
                          title="Request Payout"
                          onPress={() => handleRequestPayout(group)}
                          variant="primary"
                          size="small"
                          fullWidth={false}
                        />
                      )}
                      
                      {statusInfo.status === 'pending' && (
                        <View className="bg-yellow-50 p-3 rounded-lg">
                          <Text className="text-yellow-700 text-sm text-center">
                            Payout request is being processed
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
            </View>
          )}
        </Card>

        {/* Payout History */}
        <Card>
          <Text className="text-lg font-semibold text-primary mb-4">
            Payout History
          </Text>
          
          {payouts.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="cash-outline" size={48} color={COLORS.textSecondary} />
              <Text className="text-text-secondary text-center mt-2">
                No payouts yet
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {payouts.slice(0, 10).map((payout) => {
                const group = groups.find(g => g.id === payout.groupId);
                
                return (
                  <View
                    key={payout.id}
                    className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="font-semibold text-primary">
                          {group?.name || 'Unknown Group'}
                        </Text>
                        <Text className="text-text-secondary text-sm">
                          Cycle {payout.cycleNumber}
                        </Text>
                        <Text className="text-text-secondary text-sm">
                          {payout.paidAt ? formatDate(payout.paidAt) : formatDate(payout.createdAt)}
                        </Text>
                      </View>
                      
                      <View className="items-end">
                        <Text className="font-bold text-accent">
                          {payout.amount} {group?.currency || 'USD'}
                        </Text>
                        <View className={`px-2 py-1 rounded-full mt-1 ${
                          payout.status === 'completed' ? 'bg-green-100' :
                          payout.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <Text className={`text-xs font-medium capitalize ${
                            payout.status === 'completed' ? 'text-green-600' :
                            payout.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {payout.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
