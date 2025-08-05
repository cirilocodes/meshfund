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

import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/colors';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function ContributionScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const { groups, loadUserGroups, makeContribution } = useGroupStore();
  const { user } = useAuthStore();

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

  const handleContribution = (groupId: string, amount: string) => {
    Alert.alert(
      'Payment Method',
      'Choose your payment method:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Credit Card (Stripe)',
          onPress: () => processPayment(groupId, amount, 'stripe'),
        },
        {
          text: 'PayPal',
          onPress: () => processPayment(groupId, amount, 'paypal'),
        },
      ]
    );
  };

  const processPayment = async (groupId: string, amount: string, method: string) => {
    try {
      await makeContribution(groupId, amount, method);
      Alert.alert('Success!', 'Your contribution has been processed successfully.');
      loadUserGroups(); // Refresh the data
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || 'Failed to process payment. Please try again.');
    }
  };

  const getActiveGroups = () => {
    return groups.filter(group => !group.isLocked);
  };

  const getPendingContributions = () => {
    // In a real app, this would be fetched from the API
    return groups.map(group => ({
      groupId: group.id,
      groupName: group.name,
      amount: group.contributionAmount,
      currency: group.currency,
      dueDate: group.nextPaymentDue || new Date().toISOString(),
      status: 'pending' as const,
    }));
  };

  const getTotalMonthlyContributions = () => {
    return groups.reduce((total, group) => {
      if (group.frequency === 'monthly') {
        return total + parseFloat(group.contributionAmount);
      }
      return total;
    }, 0);
  };

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
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 }}>
            Contributions
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>
            Manage your payments and track your savings progress
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <Card style={{ flex: 1, backgroundColor: COLORS.primary }}>
            <Text style={{ color: 'white', fontSize: 14, opacity: 0.8 }}>Monthly Total</Text>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              ${getTotalMonthlyContributions().toFixed(2)}
            </Text>
          </Card>
          
          <Card style={{ flex: 1, backgroundColor: COLORS.secondary }}>
            <Text style={{ color: 'white', fontSize: 14, opacity: 0.8 }}>Active Groups</Text>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              {getActiveGroups().length}
            </Text>
          </Card>
        </View>

        {/* Pending Contributions */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
            Pending Payments
          </Text>
          
          {getPendingContributions().length === 0 ? (
            <Card>
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.success, marginTop: 12 }}>
                  All Caught Up!
                </Text>
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 }}>
                  You have no pending contributions at this time
                </Text>
              </View>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {getPendingContributions().map((contribution) => (
                <Card key={contribution.groupId}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 }}>
                        {contribution.groupName}
                      </Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                        Due: {new Date(contribution.dueDate).toLocaleDateString()}
                      </Text>
                      <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>
                        {contribution.amount} {contribution.currency}
                      </Text>
                    </View>
                    
                    <Button
                      title="Pay Now"
                      onPress={() => handleContribution(contribution.groupId, contribution.amount)}
                      size="small"
                    />
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* All Groups */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
            All Groups
          </Text>
          
          {groups.length === 0 ? (
            <Card>
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
                <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.primary, marginTop: 16, marginBottom: 8 }}>
                  No Groups Yet
                </Text>
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 }}>
                  Join or create a savings group to start contributing
                </Text>
                <Button
                  title="Create Group"
                  onPress={() => navigation.navigate('Groups')}
                />
              </View>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
                >
                  <Card>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 }}>
                          {group.name}
                        </Text>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                          {group.frequency.charAt(0).toUpperCase() + group.frequency.slice(1)} • Cycle {group.currentCycle}
                        </Text>
                      </View>
                      
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.primary }}>
                          {group.contributionAmount} {group.currency}
                        </Text>
                        <View style={{
                          backgroundColor: group.isLocked ? COLORS.error : COLORS.success,
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          marginTop: 4,
                        }}>
                          <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                            {group.isLocked ? 'Locked' : 'Active'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginLeft: 4 }}>
                          {group.maxMembers} members
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => handleContribution(group.id, group.contributionAmount)}
                      >
                        <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>
                          Contribute →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}