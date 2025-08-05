import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ViewStyle,
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
  containerStyle?: ViewStyle;
  className?: string;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  className = '',
  secureTextEntry,
  ...props
}: InputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };

  const getInputContainerStyle = (): ViewStyle => {
    return {
      borderWidth: 1,
      borderColor: error ? COLORS.error : (isFocused ? COLORS.primary : COLORS.border),
      borderRadius: 12,
      backgroundColor: COLORS.surface,
      paddingHorizontal: 16,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
    };
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: COLORS.textPrimary,
          marginBottom: 8,
        }}>
          {label}
        </Text>
      )}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={COLORS.textSecondary}
            style={{ marginRight: 12 }}
          />
        )}
        
        <TextInput
          {...props}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            fontSize: 16,
            color: COLORS.textPrimary,
            paddingVertical: 0,
          }}
          placeholderTextColor={COLORS.placeholder}
        />
        
        {secureTextEntry && (
          <TouchableOpacity onPress={toggleSecureEntry} style={{ marginLeft: 12 }}>
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity onPress={onRightIconPress} style={{ marginLeft: 12 }}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={{
          fontSize: 14,
          color: COLORS.error,
          marginTop: 4,
        }}>
          {error}
        </Text>
      )}
    </View>
  );
}