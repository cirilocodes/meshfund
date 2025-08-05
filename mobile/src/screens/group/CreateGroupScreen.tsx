import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useGroupStore } from '../../store/groupStore';
import { COLORS } from '../../constants/colors';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

export default function CreateGroupScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contributionAmount: '',
    frequency: 'monthly',
    maxMembers: '',
    currency: 'USD',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { createGroup } = useGroupStore();

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }
    
    if (!formData.contributionAmount || parseFloat(formData.contributionAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid contribution amount');
      return;
    }
    
    if (!formData.maxMembers || parseInt(formData.maxMembers) < 2) {
      Alert.alert('Error', 'Group must have at least 2 members');
      return;
    }

    setIsLoading(true);
    try {
      await createGroup({
        name: formData.name.trim(),
        description: formData.description.trim(),
        contributionAmount: formData.contributionAmount,
        frequency: formData.frequency,
        maxMembers: parseInt(formData.maxMembers),
        currency: formData.currency,
      });
      
      Alert.alert(
        'Success',
        'Group created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const frequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
  ];

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'GHS', label: 'GHS (₵)' },
    { value: 'NGN', label: 'NGN (₦)' },
    { value: 'KES', label: 'KES (KSh)' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 24 }}>
        {/* Header */}
        <Card style={{ marginBottom: 24, backgroundColor: COLORS.primary }}>
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <View style={{
              width: 64,
              height: 64,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
              <Ionicons name="people" size={32} color="white" />
            </View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
              Create New Group
            </Text>
            <Text style={{ color: 'white', opacity: 0.8, textAlign: 'center' }}>
              Start a savings circle with friends, family, or colleagues
            </Text>
          </View>
        </Card>

        {/* Group Details */}
        <Card style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
            Group Information
          </Text>
          
          <Input
            label="Group Name *"
            placeholder="e.g., Family Vacation Fund"
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
            style={{ marginBottom: 16 }}
          />
          
          <Input
            label="Description"
            placeholder="What is this group saving for?"
            value={formData.description}
            onChangeText={(value) => updateField('description', value)}
            multiline
            numberOfLines={3}
            style={{ marginBottom: 16 }}
          />
        </Card>

        {/* Financial Details */}
        <Card style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
            Financial Settings
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 2 }}>
              <Input
                label="Contribution Amount *"
                placeholder="100"
                value={formData.contributionAmount}
                onChangeText={(value) => updateField('contributionAmount', value)}
                keyboardType="numeric"
              />
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 }}>
                Currency
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {currencies.map((currency) => (
                  <TouchableOpacity
                    key={currency.value}
                    onPress={() => updateField('currency', currency.value)}
                    style={{
                      backgroundColor: formData.currency === currency.value ? COLORS.primary : COLORS.surfaceLight,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{
                      color: formData.currency === currency.value ? 'white' : COLORS.textPrimary,
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      {currency.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 }}>
            Payment Frequency
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {frequencies.map((freq) => (
              <TouchableOpacity
                key={freq.value}
                onPress={() => updateField('frequency', freq.value)}
                style={{
                  flex: 1,
                  backgroundColor: formData.frequency === freq.value ? COLORS.primary : COLORS.surfaceLight,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: formData.frequency === freq.value ? 'white' : COLORS.textPrimary,
                  fontWeight: '600',
                }}>
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Group Settings */}
        <Card style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
            Group Settings
          </Text>
          
          <Input
            label="Maximum Members *"
            placeholder="e.g., 10"
            value={formData.maxMembers}
            onChangeText={(value) => updateField('maxMembers', value)}
            keyboardType="numeric"
            style={{ marginBottom: 16 }}
          />
          
          <View style={{ backgroundColor: COLORS.info + '10', borderRadius: 8, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="information-circle" size={20} color={COLORS.info} />
              <Text style={{ color: COLORS.info, fontWeight: '600', marginLeft: 8 }}>
                How It Works
              </Text>
            </View>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 }}>
              Each cycle, one member receives the total contributions from all members. 
              The cycle continues until everyone has received a payout.
            </Text>
          </View>
        </Card>

        {/* Summary */}
        {formData.contributionAmount && formData.maxMembers && (
          <Card style={{ marginBottom: 32, backgroundColor: COLORS.accent + '10', borderColor: COLORS.accent + '30' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.accent, marginBottom: 12 }}>
              Group Summary
            </Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: COLORS.textSecondary }}>Total Pool Per Cycle:</Text>
                <Text style={{ fontWeight: '600', color: COLORS.textPrimary }}>
                  {(parseFloat(formData.contributionAmount || '0') * parseInt(formData.maxMembers || '0')).toFixed(2)} {formData.currency}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: COLORS.textSecondary }}>Group Duration:</Text>
                <Text style={{ fontWeight: '600', color: COLORS.textPrimary }}>
                  {formData.maxMembers} {formData.frequency} cycles
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <Button
            title="Create Group"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!formData.name || !formData.contributionAmount || !formData.maxMembers}
          />
          
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </View>
    </ScrollView>
  );
}