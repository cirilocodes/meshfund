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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();

  const validateForm = () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(email, password, fullName, phoneNumber || undefined);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Unable to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo/Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-primary rounded-2xl items-center justify-center mb-6">
              <Text className="text-white text-2xl font-bold">M</Text>
            </View>
            <Text className="text-3xl font-bold text-primary mb-2">Join MeshFund</Text>
            <Text className="text-text-secondary text-center text-base">
              Create your account to start saving globally
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <Input
              placeholder="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoComplete="name"
            />
            
            <Input
              placeholder="Email *"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            
            <Input
              placeholder="Phone Number (Optional)"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            
            <Input
              placeholder="Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            
            <Input
              placeholder="Confirm Password *"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            <Button
              title={isLoading ? 'Creating Account...' : 'Create Account'}
              onPress={handleSignup}
              loading={isLoading}
              className="mt-6"
            />
          </View>

          {/* Terms */}
          <Text className="text-text-secondary text-sm text-center mt-6 leading-5">
            By creating an account, you agree to our{' '}
            <Text className="text-primary">Terms of Service</Text> and{' '}
            <Text className="text-primary">Privacy Policy</Text>
          </Text>

          {/* Footer */}
          <View className="flex-row items-center justify-center mt-8">
            <Text className="text-text-secondary text-base">
              Already have an account? 
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              className="ml-1"
            >
              <Text className="text-primary text-base font-medium">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
