import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { COLORS } from '../../constants/colors';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuthStore();
  const { groups, loadUserGroups } = useGroupStore();

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

  const getTotalSavings = () => {
    return groups.reduce((total, group) => {
      return total + (parseFloat(group.contributionAmount) * group.currentCycle);
    }, 0);
  };

  const getUpcomingPayments = () => {
    return groups.filter(group => !group.isLocked).length;
  };

  const getActiveGroups = () => {
    return groups.filter(group => !group.isLocked);
  };

  const getRecentActivity = () => {
    // Mock recent activity for demonstration
    return [
      {
        id: '1',
        type: 'contribution',
        title: 'Payment Received',
        description: 'Family Vacation Fund - $200',
        time: '2 hours ago',
        icon: 'arrow-down-circle',
        color: COLORS.success,
      },
      {
        id: '2',
        type: 'payout',
        title: 'Payout Sent',
        description: 'Wedding Savings Circle - $1,200',
        time: '1 day ago',
        icon: 'arrow-up-circle',
        color: COLORS.primary,
      },
      {
        id: '3',
        type: 'group_update',
        title: 'New Member',
        description: 'John joined Business Investment Group',
        time: '3 days ago',
        icon: 'person-add',
        color: COLORS.info,
      },
    ];
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
      {/* Header */}
      <View style={{ padding: 24, backgroundColor: COLORS.primary }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ color: 'white', fontSize: 16, opacity: 0.9 }}>
              Welcome back,
            </Text>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
              {user?.username || user?.email || 'User'}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={{
              width: 48,
              height: 48,
              backgroundColor: 'white',
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: 'bold' }}>
              {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text style={{ color: 'white', fontSize: 14, opacity: 0.8 }}>Total Saved</Text>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              ${getTotalSavings().toFixed(2)}
            </Text>
          </Card>
          
          <Card style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text style={{ color: 'white', fontSize: 14, opacity: 0.8 }}>Active Groups</Text>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              {getActiveGroups().length}
            </Text>
          </Card>
        </View>
      </View>

      <View style={{ padding: 24 }}>
        {/* Quick Actions */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
            Quick Actions
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('CreateGroup')}
            >
              <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  backgroundColor: COLORS.primary + '20',
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary }}>
                  Create Group
                </Text>
              </Card>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('Contributions')}
            >
              <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  backgroundColor: COLORS.success + '20',
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  <Ionicons name="card" size={24} color={COLORS.success} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary }}>
                  Pay Now
                </Text>
              </Card>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('Groups')}
            >
              <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  backgroundColor: COLORS.info + '20',
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  <Ionicons name="people" size={24} color={COLORS.info} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary }}>
                  My Groups
                </Text>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Groups */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.primary }}>
              Active Groups
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Groups')}>
              <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          
          {getActiveGroups().length === 0 ? (
            <Card>
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="people-outline" size={48} color={COLORS.textSecondary} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginTop: 12, marginBottom: 8 }}>
                  No Active Groups
                </Text>
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 }}>
                  Create or join a savings group to get started
                </Text>
                <Button
                  title="Create Group"
                  onPress={() => navigation.navigate('CreateGroup')}
                  size="small"
                />
              </View>
            </Card>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                {getActiveGroups().slice(0, 3).map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
                  >
                    <Card style={{ width: width * 0.7, marginRight: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 }}>
                        {group.name}
                      </Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 12 }}>
                        {group.description || 'No description'}
                      </Text>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.primary }}>
                            {group.contributionAmount} {group.currency}
                          </Text>
                          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                            {group.frequency} contribution
                          </Text>
                        </View>
                        
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary }}>
                            Cycle {group.currentCycle}
                          </Text>
                          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                            of {group.maxMembers}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Recent Activity */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
            Recent Activity
          </Text>
          
          <Card>
            {getRecentActivity().map((activity, index) => (
              <View key={activity.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    backgroundColor: activity.color + '15',
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name={activity.icon as any} size={20} color={activity.color} />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary }}>
                      {activity.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                      {activity.description}
                    </Text>
                  </View>
                  
                  <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                    {activity.time}
                  </Text>
                </View>
                
                {index < getRecentActivity().length - 1 && (
                  <View style={{ height: 1, backgroundColor: COLORS.borderLight, marginVertical: 4 }} />
                )}
              </View>
            ))}
          </Card>
        </View>

        {/* Upcoming Payments */}
        {getUpcomingPayments() > 0 && (
          <Card style={{ backgroundColor: COLORS.warning + '10', borderColor: COLORS.warning + '30' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="time-outline" size={20} color={COLORS.warning} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.warning, marginLeft: 8 }}>
                Upcoming Payments
              </Text>
            </View>
            <Text style={{ color: COLORS.textSecondary, marginBottom: 16 }}>
              You have {getUpcomingPayments()} payment{getUpcomingPayments() !== 1 ? 's' : ''} due soon
            </Text>
            <Button
              title="Make Payments"
              onPress={() => navigation.navigate('Contributions')}
              variant="outline"
              size="small"
            />
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
