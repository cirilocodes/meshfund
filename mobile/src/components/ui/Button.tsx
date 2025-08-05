import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS } from '../../constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  fullWidth = true,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary';
      case 'secondary':
        return 'bg-accent';
      case 'outline':
        return 'bg-transparent border-2 border-primary';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-primary';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'outline':
        return 'text-primary';
      default:
        return 'text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-4 py-2';
      case 'medium':
        return 'px-6 py-4';
      case 'large':
        return 'px-8 py-5';
      default:
        return 'px-6 py-4';
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl
        items-center
        justify-center
        flex-row
        ${isDisabled ? 'opacity-50' : ''}
        ${className || ''}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? COLORS.primary : 'white'}
          style={{ marginRight: 8 }}
        />
      )}
      {icon && !loading && (
        <View style={{ marginRight: 8 }}>
          {icon}
        </View>
      )}
      <Text
        className={`
          ${getTextStyles()}
          ${getTextSizeStyles()}
          font-semibold
        `}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
