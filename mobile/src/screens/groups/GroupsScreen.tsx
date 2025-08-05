import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/colors';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function GroupsScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { groups, loadUserGroups, joinGroup } = useGroupStore();
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

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGroupStatus = (group: any) => {
    if (group.isLocked) return { text: 'Locked', color: COLORS.error };
    if (group.maxMembers <= 4) return { text: 'Full', color: COLORS.warning }; // Mock member count
    return { text: 'Open', color: COLORS.success };
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.primary }}>
              Savings Groups
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>
              Manage your financial circles
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateGroup')}
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 4 }}>
              Create
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              color: COLORS.textPrimary,
              marginLeft: 12,
            }}
            placeholder="Search groups..."
            placeholderTextColor={COLORS.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <Card style={{ flex: 1, backgroundColor: COLORS.primary }}>
            <Text style={{ color: 'white', fontSize: 14, opacity: 0.8 }}>My Groups</Text>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
              {groups.length}
            </Text>
          </Card>
          
          <Card style={{ flex: 1, backgroundColor: COLORS.secondary }}>
            <Text style={{ color: 'white', fontSize: 14, opacity: 0.8 }}>Active</Text>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
              {groups.filter(g => !g.isLocked).length}
            </Text>
          </Card>
        </View>

        {/* Groups List */}
        {filteredGroups.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
              <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.primary, marginTop: 16, marginBottom: 8 }}>
                {searchQuery ? 'No Results Found' : 'No Groups Yet'}
              </Text>
              <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 }}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Create or join a savings group to get started'
                }
              </Text>
              {!searchQuery && (
                <Button
                  title="Create Your First Group"
                  onPress={() => navigation.navigate('CreateGroup')}
                />
              )}
            </View>
          </Card>
        ) : (
          <View style={{ gap: 16 }}>
            {filteredGroups.map((group) => {
              const status = getGroupStatus(group);
              const isUserAdmin = group.adminId === user?.id;
              const currentMembers = 4; // Mock data - would come from API
              
              return (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
                >
                  <Card>
                    {/* Group Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.textPrimary }}>
                            {group.name}
                          </Text>
                          {isUserAdmin && (
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
                        {group.description && (
                          <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 8 }}>
                            {group.description}
                          </Text>
                        )}
                      </View>
                      
                      <View style={{
                        backgroundColor: status.color + '10',
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}>
                        <Text style={{ color: status.color, fontSize: 12, fontWeight: '600' }}>
                          {status.text}
                        </Text>
                      </View>
                    </View>

                    {/* Group Details */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.primary }}>
                            {group.contributionAmount}
                          </Text>
                          <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                            {group.currency}
                          </Text>
                        </View>
                        
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textPrimary }}>
                            {group.currentCycle}
                          </Text>
                          <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                            Cycle
                          </Text>
                        </View>
                      </View>
                      
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>
                          {group.frequency.charAt(0).toUpperCase() + group.frequency.slice(1)}
                        </Text>
                      </View>
                    </View>

                    {/* Members Info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginLeft: 4 }}>
                          {group.maxMembers} members max
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
                      >
                        <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>
                          View Details →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Browse Public Groups Section */}
        <View style={{ marginTop: 32 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
            Discover Groups
          </Text>
          
          <Card style={{ borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.primary + '40' }}>
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Ionicons name="compass-outline" size={48} color={COLORS.primary} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.primary, marginTop: 12, marginBottom: 8 }}>
                Browse Public Groups
              </Text>
              <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 }}>
                Find open savings circles in your area or with shared interests
              </Text>
              <Button
                title="Explore Groups"
                onPress={() => {
                  // TODO: Navigate to group discovery screen
                }}
                variant="outline"
              />
            </View>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}