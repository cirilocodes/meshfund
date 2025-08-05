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

import { ContributionService, Contribution } from '../../services/contributions';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/colors';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PaymentMethods from '../../components/payments/PaymentMethods';

export default function ContributionScreen({ route, navigation }: any) {
  const { groupId } = route.params || {};
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(groupId || null);

  const { groups, loadUserGroups } = useGroupStore();
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
      const userContributions = await ContributionService.getUserContributions(selectedGroup || undefined);
      setContributions(userContributions);
    } catch (error) {
      console.error('Failed to load contributions:', error);
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

  const handleMakeContribution = (group: any) => {
    const currentCycleContribution = contributions.find(
      c => c.groupId === group.id && c.cycleNumber === group.currentCycle
    );

    if (currentCycleContribution && currentCycleContribution.status === 'paid') {
      Alert.alert(
        'Already Contributed',
        'You have already made your contribution for this cycle.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedGroup(group.id);
    setShowPaymentMethods(true);
  };

  const handlePaymentSuccess = async (paymentMethod: string, transactionId: string) => {
    if (!selectedGroup) return;

    try {
      setIsLoading(true);
      
      const group = groups.find(g => g.id === selectedGroup);
      if (!group) {
        throw new Error('Group not found');
      }

      await ContributionService.makeContribution(selectedGroup, {
        amount: group.contributionAmount,
        paymentMethod,
      });

      Alert.alert(
        'Success',
        'Your contribution has been processed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPaymentMethods(false);
              loadData();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process contribution');
    } finally {
      setIsLoading(false);
    }
  };

  const getContributionStatus = (group: any) => {
    const currentCycleContribution = contributions.find(
      c => c.groupId === group.id && c.cycleNumber === group.currentCycle
    );

    if (!currentCycleContribution) {
      return { status: 'pending', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }

    switch (currentCycleContribution.status) {
      case 'paid':
        return { status: 'paid', color: 'text-green-600', bg: 'bg-green-100' };
      case 'late':
        return { status: 'late', color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'missed':
        return { status: 'missed', color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { status: 'pending', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (showPaymentMethods && selectedGroup) {
    const group = groups.find(g => g.id === selectedGroup);
    
    return (
      <PaymentMethods
        amount={group?.contributionAmount || '0'}
        currency={group?.currency || 'USD'}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowPaymentMethods(false)}
        isLoading={isLoading}
      />
    );
  }

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
        <Text className="text-2xl font-bold text-primary mb-6">Contributions</Text>

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

        {/* Current Contributions Needed */}
        <Card className="mb-6">
          <Text className="text-lg font-semibold text-primary mb-4">
            Contributions Due
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
                  const statusInfo = getContributionStatus(group);
                  
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
                        </View>
                        
                        <View className="items-end">
                          <Text className="text-xl font-bold text-accent">
                            {group.currency} {group.contributionAmount}
                          </Text>
                          <View className={`px-3 py-1 rounded-full ${statusInfo.bg} mt-1`}>
                            <Text className={`text-xs font-medium capitalize ${statusInfo.color}`}>
                              {statusInfo.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      {group.nextPaymentDue && (
                        <Text className="text-text-secondary text-sm mb-3">
                          Due: {formatDate(group.nextPaymentDue)}
                        </Text>
                      )}
                      
                      {statusInfo.status !== 'paid' && (
                        <Button
                          title="Make Contribution"
                          onPress={() => handleMakeContribution(group)}
                          variant="primary"
                          size="small"
                          fullWidth={false}
                        />
                      )}
                    </View>
                  );
                })}
            </View>
          )}
        </Card>

        {/* Contribution History */}
        <Card>
          <Text className="text-lg font-semibold text-primary mb-4">
            Contribution History
          </Text>
          
          {contributions.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="receipt-outline" size={48} color={COLORS.textSecondary} />
              <Text className="text-text-secondary text-center mt-2">
                No contributions yet
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {contributions.slice(0, 10).map((contribution) => {
                const group = groups.find(g => g.id === contribution.groupId);
                const statusInfo = getContributionStatus({ 
                  id: contribution.groupId, 
                  currentCycle: contribution.cycleNumber 
                });
                
                return (
                  <View
                    key={contribution.id}
                    className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="font-semibold text-primary">
                          {group?.name || 'Unknown Group'}
                        </Text>
                        <Text className="text-text-secondary text-sm">
                          Cycle {contribution.cycleNumber}
                        </Text>
                        <Text className="text-text-secondary text-sm">
                          {formatDate(contribution.createdAt)}
                        </Text>
                      </View>
                      
                      <View className="items-end">
                        <Text className="font-bold text-primary">
                          {contribution.amount} {group?.currency || 'USD'}
                        </Text>
                        <View className={`px-2 py-1 rounded-full ${statusInfo.bg} mt-1`}>
                          <Text className={`text-xs font-medium capitalize ${statusInfo.color}`}>
                            {contribution.status}
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
