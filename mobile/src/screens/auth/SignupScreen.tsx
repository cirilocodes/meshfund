import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/colors';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function SignupScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phoneNumber || undefined
      );
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Unable to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View style={{ 
              width: 80, 
              height: 80, 
              backgroundColor: COLORS.primary, 
              borderRadius: 16, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 24 
            }}>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>M</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 }}>
              Join MeshFund
            </Text>
            <Text style={{ color: COLORS.textSecondary, textAlign: 'center', fontSize: 16 }}>
              Create your account to start your savings journey
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              autoCapitalize="words"
              autoComplete="name"
            />
            
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            
            <Input
              label="Phone Number (Optional)"
              placeholder="Enter your phone number"
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            
            <Input
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              autoComplete="new-password"
            />
            
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry
              autoComplete="new-password"
            />

            <Button
              title={isLoading ? 'Creating Account...' : 'Create Account'}
              onPress={handleSignup}
              loading={isLoading}
              style={{ marginTop: 24 }}
            />
          </View>

          {/* Terms */}
          <Text style={{ 
            color: COLORS.textSecondary, 
            fontSize: 14, 
            textAlign: 'center', 
            marginTop: 24,
            lineHeight: 20 
          }}>
            By creating an account, you agree to our{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Privacy Policy</Text>
          </Text>

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>
                Already have an account? 
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                style={{ marginLeft: 4 }}
              >
                <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '600' }}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}