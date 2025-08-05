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

export default function GroupDetailsScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { getGroupById, leaveGroup, joinGroup } = useGroupStore();
  const { user } = useAuthStore();

  const loadGroupDetails = useCallback(async () => {
    try {
      const groupData = await getGroupById(groupId);
      setGroup(groupData);
    } catch (error) {
      console.error('Failed to load group details:', error);
      Alert.alert('Error', 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useFocusEffect(loadGroupDetails);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroupDetails();
    setRefreshing(false);
  }, [loadGroupDetails]);

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
              Alert.alert('Error', error.message || 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  const handleJoinGroup = async () => {
    try {
      await joinGroup(groupId);
      await loadGroupDetails();
      Alert.alert('Success', 'You have joined the group!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join group');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return COLORS.success;
      case 'locked': return COLORS.error;
      case 'full': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const getMockMembers = () => [
    { id: '1', name: 'John Doe', avatar: 'JD', status: 'paid', isAdmin: true },
    { id: '2', name: 'Jane Smith', avatar: 'JS', status: 'pending', isAdmin: false },
    { id: '3', name: 'Mike Johnson', avatar: 'MJ', status: 'paid', isAdmin: false },
    { id: '4', name: 'Sarah Wilson', avatar: 'SW', status: 'overdue', isAdmin: false },
  ];

  const getMockTransactions = () => [
    { id: '1', type: 'contribution', member: 'John Doe', amount: 200, date: '2025-01-15', status: 'completed' },
    { id: '2', type: 'payout', member: 'Jane Smith', amount: 800, date: '2025-01-10', status: 'completed' },
    { id: '3', type: 'contribution', member: 'Mike Johnson', amount: 200, date: '2025-01-08', status: 'completed' },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.textSecondary }}>Loading group details...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.error, marginTop: 16, marginBottom: 8 }}>
          Group Not Found
        </Text>
        <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          This group may have been deleted or you don't have access to it.
        </Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const isUserMember = true; // Mock - would check actual membership
  const isUserAdmin = group.adminId === user?.id;
  const members = getMockMembers();
  const transactions = getMockTransactions();

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
      {/* Header */}
      <View style={{ padding: 24, backgroundColor: COLORS.primary }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
              {group.name}
            </Text>
            {group.description && (
              <Text style={{ color: 'white', opacity: 0.9, fontSize: 16 }}>
                {group.description}
              </Text>
            )}
          </View>
          
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
              {group.isLocked ? 'LOCKED' : 'ACTIVE'}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text style={{ color: 'white', fontSize: 12, opacity: 0.8 }}>Pool Amount</Text>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              {(parseFloat(group.contributionAmount) * 4).toFixed(2)} {group.currency}
            </Text>
          </Card>
          
          <Card style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text style={{ color: 'white', fontSize: 12, opacity: 0.8 }}>Cycle</Text>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              {group.currentCycle} of {group.maxMembers}
            </Text>
          </Card>
          
          <Card style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text style={{ color: 'white', fontSize: 12, opacity: 0.8 }}>Members</Text>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              {members.length}/{group.maxMembers}
            </Text>
          </Card>
        </View>
      </View>

      <View style={{ padding: 24 }}>
        {/* Action Buttons */}
        {isUserMember ? (
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <Button
              title="Make Payment"
              onPress={() => navigation.navigate('Contributions', { groupId })}
              style={{ flex: 1 }}
            />
            {isUserAdmin ? (
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.accent,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => {/* Navigate to group settings */}}
              >
                <Ionicons name="settings" size={20} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.error,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={handleLeaveGroup}
              >
                <Ionicons name="exit" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Button
            title="Join Group"
            onPress={handleJoinGroup}
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Members */}
        <Card style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.primary }}>
              Members ({members.length})
            </Text>
            {isUserAdmin && (
              <TouchableOpacity>
                <Ionicons name="person-add" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={{ gap: 12 }}>
            {members.map((member, index) => (
              <View key={member.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      backgroundColor: COLORS.primary,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>
                        {member.avatar}
                      </Text>
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textPrimary }}>
                          {member.name}
                        </Text>
                        {member.isAdmin && (
                          <View style={{
                            backgroundColor: COLORS.accent + '20',
                            borderRadius: 4,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            marginLeft: 8,
                          }}>
                            <Text style={{ color: COLORS.accent, fontSize: 10, fontWeight: '600' }}>
                              ADMIN
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                        Current cycle payment
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{
                    backgroundColor: 
                      member.status === 'paid' ? COLORS.success + '15' :
                      member.status === 'pending' ? COLORS.warning + '15' :
                      COLORS.error + '15',
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}>
                    <Text style={{
                      color: 
                        member.status === 'paid' ? COLORS.success :
                        member.status === 'pending' ? COLORS.warning :
                        COLORS.error,
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                {index < members.length - 1 && (
                  <View style={{ height: 1, backgroundColor: COLORS.borderLight, marginTop: 12 }} />
                )}
              </View>
            ))}
          </View>
        </Card>

        {/* Recent Transactions */}
        <Card style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
            Recent Transactions
          </Text>
          
          {transactions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.textSecondary} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>
                No transactions yet
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {transactions.map((transaction, index) => (
                <View key={transaction.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={{
                        width: 36,
                        height: 36,
                        backgroundColor: 
                          transaction.type === 'contribution' ? COLORS.success + '15' : COLORS.info + '15',
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        <Ionicons 
                          name={transaction.type === 'contribution' ? 'arrow-down' : 'arrow-up'} 
                          size={16} 
                          color={transaction.type === 'contribution' ? COLORS.success : COLORS.info} 
                        />
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary }}>
                          {transaction.type === 'contribution' ? 'Contribution' : 'Payout'}
                        </Text>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                          {transaction.member} • {transaction.date}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: 'bold', 
                      color: transaction.type === 'contribution' ? COLORS.success : COLORS.primary 
                    }}>
                      {transaction.type === 'contribution' ? '+' : '-'}${transaction.amount}
                    </Text>
                  </View>
                  
                  {index < transactions.length - 1 && (
                    <View style={{ height: 1, backgroundColor: COLORS.borderLight, marginTop: 12 }} />
                  )}
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Group Rules */}
        <Card>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
            Group Rules & Information
          </Text>
          
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginLeft: 8 }}>
                {group.frequency.charAt(0).toUpperCase() + group.frequency.slice(1)} contributions of {group.contributionAmount} {group.currency}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginLeft: 8 }}>
                Maximum {group.maxMembers} members allowed
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.textSecondary} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginLeft: 8 }}>
                All transactions are secured and monitored
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginLeft: 8 }}>
                Late payments may result in penalties
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}