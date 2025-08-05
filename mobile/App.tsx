import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from stored token
    initialize();

    // Request notification permissions
    registerForPushNotificationsAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#FAF9F6" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

async function registerForPushNotificationsAsync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo push token:', token);
    
    // Store token securely
    await SecureStore.setItemAsync('pushToken', token);
  } catch (error) {
    console.log('Error registering for push notifications:', error);
  }
}
