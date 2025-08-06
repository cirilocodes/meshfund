import React, { useState } from 'react';
import { styled } from 'nativewind';
import { View as RNView, Text as RNText, ScrollView as RNScrollView, TouchableOpacity as RNTouchableOpacity, Modal as RNModal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

import { ContributionService } from '../../services/contributions';
import { COLORS } from '../../constants/colors';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface PaymentMethodsProps {
  amount: string;
  currency: string;
  onSuccess: (paymentMethod: string, transactionId: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank' | 'mobile_money' | 'crypto';
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'stripe_card',
    type: 'card',
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard, American Express',
    icon: 'card-outline',
    enabled: true,
  },
  {
    id: 'paypal',
    type: 'paypal',
    name: 'PayPal',
    description: 'Pay with your PayPal account',
    icon: 'logo-usd',
    enabled: true,
  },
  {
    id: 'bank_transfer',
    type: 'bank',
    name: 'Bank Transfer',
    description: 'Direct bank to bank transfer',
    icon: 'business-outline',
    enabled: false, // Would need additional implementation
  },
  {
    id: 'mobile_money',
    type: 'mobile_money',
    name: 'Mobile Money',
    description: 'MTN, Airtel, Vodafone',
    icon: 'phone-portrait-outline',
    enabled: false, // Would need additional implementation
  },
  {
    id: 'crypto',
    type: 'crypto',
    name: 'Cryptocurrency',
    description: 'Bitcoin, Ethereum, USDC',
    icon: 'logo-bitcoin',
    enabled: false, // Would need additional implementation
  },
];

export default function PaymentMethods({
  amount,
  currency,
  onSuccess,
  onCancel,
  isLoading = false,
}: PaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });
  const [processing, setProcessing] = useState(false);
  const View = styled(RNView);
  const Text = styled(RNText);
  const ScrollView = styled(RNScrollView);
  const TouchableOpacity = styled(RNTouchableOpacity);
  const Modal = styled(RNModal);

  const handleMethodSelect = (method: PaymentMethod) => {
    if (!method.enabled) {
      Alert.alert(
        'Coming Soon',
        `${method.name} payment method will be available soon.`
      );
      return;
    }

    setSelectedMethod(method);

    switch (method.type) {
      case 'card':
        setShowCardForm(true);
        break;
      case 'paypal':
        handlePayPalPayment();
        break;
      default:
        Alert.alert('Coming Soon', 'This payment method is not yet available.');
    }
  };

  const handleCardPayment = async () => {
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name) {
      Alert.alert('Error', 'Please fill in all card details');
      return;
    }

    setProcessing(true);
    try {
      // Create Stripe payment intent
      const clientSecret = await ContributionService.createStripePaymentIntent(amount, currency);
      
      // In a real implementation, you would use Stripe's React Native SDK
      // to handle the payment with the clientSecret
      console.log('Stripe payment intent created:', clientSecret);
      
      // Simulate successful payment
      setTimeout(() => {
        onSuccess('stripe_card', 'mock_transaction_' + Date.now());
        setProcessing(false);
        setShowCardForm(false);
      }, 2000);
      
    } catch (error: any) {
      setProcessing(false);
      Alert.alert('Payment Failed', error.message || 'Unable to process payment');
    }
  };

  const handlePayPalPayment = async () => {
    setProcessing(true);
    try {
      // Create PayPal order
      const orderData = await ContributionService.createPayPalOrder(amount, currency);
      console.log('PayPal order created:', orderData);
      
      // In a real implementation, you would integrate with PayPal's mobile SDK
      // to handle the payment flow
      
      // Simulate successful payment
      setTimeout(() => {
        onSuccess('paypal', orderData.id || 'mock_paypal_' + Date.now());
        setProcessing(false);
      }, 2000);
      
    } catch (error: any) {
      setProcessing(false);
      Alert.alert('Payment Failed', error.message || 'Unable to process PayPal payment');
    }
  };

  const formatAmount = () => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      GHS: '₵',
      NGN: '₦',
      KES: 'KSh',
    };
    
    return `${currencySymbols[currency] || currency} ${amount}`;
  };
  
  const StyledView = styled(View);

  return (
    <StyledView className="flex-1 bg-background">
      {/* Header */}
      <StyledView className="px-6 py-4 bg-white border-b border-gray-100">
        <StyledView className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-primary">Payment</Text>
          <View style={{ width: 24 }} />
        </StyledView>

        <StyledView className="items-center mt-4">
          <Text className="text-text-secondary">Amount to pay</Text>
          <Text className="text-3xl font-bold text-primary">{formatAmount()}</Text>
        </StyledView>
      </StyledView>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <Text className="text-xl font-semibold text-primary mb-6">
          Choose Payment Method
        </Text>

        <View className="space-y-3">
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => handleMethodSelect(method)}
              disabled={!method.enabled || processing}
            >
              <Card className={`${
                !method.enabled ? 'opacity-50' : ''
              } ${selectedMethod?.id === method.id ? 'border-2 border-primary' : ''}`}>
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                    method.enabled ? 'bg-primary' : 'bg-gray-300'
                  }`}>
                    <Ionicons
                      name={method.icon}
                      size={24}
                      color={method.enabled ? 'white' : COLORS.textSecondary}
                    />
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-primary">
                      {method.name}
                    </Text>
                    <Text className="text-text-secondary text-sm">
                      {method.description}
                    </Text>
                  </View>
                  
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {processing && (
          <View className="mt-8">
            <Card>
              <View className="items-center py-8">
                <Text className="text-primary font-semibold mb-2">
                  Processing Payment...
                </Text>
                <Text className="text-text-secondary text-center">
                  Please wait while we process your payment of {formatAmount()}
                </Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Card Payment Modal */}
      <Modal
        visible={showCardForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-background">
          <View className="px-6 py-4 bg-white border-b border-gray-100">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setShowCardForm(false)}>
                <Ionicons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-primary">Card Details</Text>
              <View style={{ width: 24 }} />
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
            <Card className="mb-6">
              <Text className="text-lg font-semibold text-primary mb-4">
                Payment Amount: {formatAmount()}
              </Text>
              
              <View className="space-y-4">
                <Input
                  label="Card Number"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChangeText={(text) => setCardDetails(prev => ({ ...prev, number: text }))}
                  keyboardType="numeric"
                  leftIcon="card-outline"
                />
                
                <View className="flex-row space-x-4">
                  <View className="flex-1">
                    <Input
                      label="Expiry Date"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChangeText={(text) => setCardDetails(prev => ({ ...prev, expiry: text }))}
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="CVC"
                      placeholder="123"
                      value={cardDetails.cvc}
                      onChangeText={(text) => setCardDetails(prev => ({ ...prev, cvc: text }))}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                <Input
                  label="Cardholder Name"
                  placeholder="John Doe"
                  value={cardDetails.name}
                  onChangeText={(text) => setCardDetails(prev => ({ ...prev, name: text }))}
                  autoCapitalize="words"
                />
              </View>
            </Card>

            <Button
              title={processing ? 'Processing...' : `Pay ${formatAmount()}`}
              onPress={handleCardPayment}
              loading={processing}
              disabled={processing}
            />
          </ScrollView>
        </View>
      </Modal>
    </StyledView>
  );
}
