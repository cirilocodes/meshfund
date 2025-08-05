import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: 'default' | 'filled';
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  secureTextEntry,
  className,
  ...props
}: InputProps) {
  const [isSecureTextVisible, setIsSecureTextVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSecureTextToggle = () => {
    setIsSecureTextVisible(!isSecureTextVisible);
  };

  const getInputStyles = () => {
    switch (variant) {
      case 'filled':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-white border-gray-300';
    }
  };

  const getBorderStyles = () => {
    if (error) return 'border-red-500';
    if (isFocused) return 'border-primary';
    return 'border-gray-300';
  };

  return (
    <View className={className}>
      {label && (
        <Text className="text-primary font-medium mb-2 text-base">
          {label}
        </Text>
      )}
      
      <View className={`
        ${getInputStyles()}
        ${getBorderStyles()}
        border
        rounded-xl
        flex-row
        items-center
        px-4
        ${leftIcon || rightIcon || secureTextEntry ? 'pr-3' : 'px-4'}
      `}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? COLORS.primary : COLORS.textSecondary}
            style={{ marginRight: 12 }}
          />
        )}
        
        <TextInput
          className="flex-1 py-4 text-base text-gray-900"
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={secureTextEntry && !isSecureTextVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={handleSecureTextToggle}
            className="ml-2 p-1"
          >
            <Ionicons
              name={isSecureTextVisible ? 'eye-off' : 'eye'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            onPress={onRightIconPress}
            className="ml-2 p-1"
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={isFocused ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text className="text-red-500 text-sm mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}
