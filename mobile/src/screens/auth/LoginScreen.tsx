import React, { useState } from 'react';
import { styled } from 'nativewind';
import { View as RNView, Text as RNText, ScrollView as RNScrollView, TouchableOpacity as RNTouchableOpacity, Modal as RNModal, KeyboardAvoidingView as RNKeyboardAvoidingView} from 'react-native';
import { Alert } from 'react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/colors';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const View = styled(RNView);
  const Text = styled(RNText);
  const ScrollView = styled(RNScrollView);
  const TouchableOpacity = styled(RNTouchableOpacity);
  const Modal = styled(RNModal);
  const KeyboardAvoidingView = styled(RNKeyboardAvoidingView);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Unable to log in. Please try again.');
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
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-primary rounded-2xl items-center justify-center mb-6">
              <Text className="text-white text-2xl font-bold">M</Text>
            </View>
            <Text className="text-3xl font-bold text-primary mb-2">Welcome Back</Text>
            <Text className="text-text-secondary text-center text-base">
              Sign in to your MeshFund account
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            <Button
              title={isLoading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              loading={isLoading}
              className="mt-6"
            />
          </View>

          {/* Footer */}
          <View className="mt-8 items-center">
            <TouchableOpacity>
              <Text className="text-primary text-base font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>
            
            <View className="flex-row items-center mt-6">
              <Text className="text-text-secondary text-base">
                Don't have an account? 
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Signup')}
                className="ml-1"
              >
                <Text className="text-primary text-base font-medium">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
