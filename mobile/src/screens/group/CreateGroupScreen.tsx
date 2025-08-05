import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useGroupStore } from '../../store/groupStore';
import { COLORS } from '../../constants/colors';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly', description: 'Every week' },
  { value: 'bi-weekly', label: 'Bi-weekly', description: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly', description: 'Every month' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)', flag: '🇺🇸' },
  { value: 'EUR', label: 'EUR (€)', flag: '🇪🇺' },
  { value: 'GBP', label: 'GBP (£)', flag: '🇬🇧' },
  { value: 'GHS', label: 'GHS (₵)', flag: '🇬🇭' },
  { value: 'NGN', label: 'NGN (₦)', flag: '🇳🇬' },
  { value: 'KES', label: 'KES (KSh)', flag: '🇰🇪' },
];

export default function CreateGroupScreen({ navigation }: any) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [maxMembers, setMaxMembers] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(false);

  const { groups, createGroup, loadUserGroups } = useGroupStore();

  useFocusEffect(
    useCallback(() => {
      loadUserGroups();
    }, [])
  );

  const validateForm = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return false;
    }

    if (!contributionAmount || isNaN(parseFloat(contributionAmount)) || parseFloat(contributionAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid contribution amount');
      return false;
    }

    if (!maxMembers || isNaN(parseInt(maxMembers)) || parseInt(maxMembers) < 2 || parseInt(maxMembers) > 50) {
      Alert.alert('Error', 'Maximum members must be between 2 and 50');
      return false;
    }

    return true;
  };

  const handleCreateGroup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await createGroup({
        name: groupName.trim(),
        description: description.trim() || undefined,
        contributionAmount,
        frequency: frequency as any,
        maxMembers: parseInt(maxMembers),
        currency,
      });

      Alert.alert(
        'Success',
        'Group created successfully!',
        [{ text: 'OK', onPress: () => setShowCreateForm(false) }]
      );

      // Reset form
      setGroupName('');
      setDescription('');
      setContributionAmount('');
      setMaxMembers('');
      setFrequency('monthly');
      setCurrency('USD');
      
      // Reload groups
      await loadUserGroups();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  if (showCreateForm) {
    return (
      <ScrollView className="flex-1 bg-background">
        <View className="px-6 py-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => setShowCreateForm(false)}
              className="mr-4"
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-primary">Create New Group</Text>
          </View>

          <Card>
            <View className="space-y-4">
              <Input
                placeholder="Group Name"
                value={groupName}
                onChangeText={setGroupName}
                autoCapitalize="words"
              />

              <Input
                placeholder="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: 'top' }}
              />

              <View className="flex-row space-x-2">
                <View className="flex-1">
                  <Input
                    placeholder="Amount"
                    value={contributionAmount}
                    onChangeText={setContributionAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="w-24">
                  <TouchableOpacity className="border border-gray-300 rounded-xl p-4 h-14 justify-center">
                    <Text className="text-primary font-medium text-center">
                      {CURRENCY_OPTIONS.find(c => c.value === currency)?.flag} {currency}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Input
                placeholder="Maximum Members"
                value={maxMembers}
                onChangeText={setMaxMembers}
                keyboardType="number-pad"
              />

              {/* Frequency Selection */}
              <View>
                <Text className="text-primary font-medium mb-3">Payment Frequency</Text>
                <View className="space-y-2">
                  {FREQUENCY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setFrequency(option.value)}
                      className={`p-4 rounded-xl border-2 ${
                        frequency === option.value
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View className="flex-1">
                          <Text className={`font-medium ${
                            frequency === option.value ? 'text-primary' : 'text-gray-700'
                          }`}>
                            {option.label}
                          </Text>
                          <Text className="text-text-secondary text-sm">
                            {option.description}
                          </Text>
                        </View>
                        {frequency === option.value && (
                          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Button
                title={isLoading ? 'Creating Group...' : 'Create Group'}
                onPress={handleCreateGroup}
                loading={isLoading}
                className="mt-6"
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 py-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-primary">My Groups</Text>
          <Button
            title="Create Group"
            onPress={() => setShowCreateForm(true)}
            variant="primary"
            size="small"
          />
        </View>

        {groups.length === 0 ? (
          <Card>
            <View className="items-center py-12">
              <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
              <Text className="text-xl font-semibold text-primary mt-4 mb-2">
                No Groups Yet
              </Text>
              <Text className="text-text-secondary text-center mb-6 px-4">
                Create your first savings group to start your financial journey with friends and family
              </Text>
              <Button
                title="Create Your First Group"
                onPress={() => setShowCreateForm(true)}
                variant="primary"
              />
            </View>
          </Card>
        ) : (
          <View className="space-y-3">
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
              >
                <Card>
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-primary mb-1">
                        {group.name}
                      </Text>
                      {group.description && (
                        <Text className="text-text-secondary text-sm mb-2">
                          {group.description}
                        </Text>
                      )}
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                        <Text className="text-text-secondary text-sm ml-1 capitalize">
                          {group.frequency} • Cycle {group.currentCycle}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-xl font-bold text-accent">
                        {CURRENCY_OPTIONS.find(c => c.value === group.currency)?.flag} {group.contributionAmount}
                      </Text>
                      <Text className="text-text-secondary text-sm">
                        per cycle
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                      <Ionicons name="people" size={16} color={COLORS.textSecondary} />
                      <Text className="text-text-secondary text-sm ml-1">
                        {group.maxMembers} members max
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${
                      group.isLocked ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <Text className={`text-xs font-medium ${
                        group.isLocked ? 'text-red-700' : 'text-green-700'
                      }`}>
                        {group.isLocked ? 'Locked' : 'Active'}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
