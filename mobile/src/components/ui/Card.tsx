import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export default function Card({
  children,
  variant = 'default',
  padding = 'medium',
  className,
  ...props
}: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-white shadow-lg shadow-gray-200/50';
      case 'outlined':
        return 'bg-white border border-gray-200';
      default:
        return 'bg-white shadow-sm shadow-gray-200/30';
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'small':
        return 'p-3';
      case 'medium':
        return 'p-4';
      case 'large':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  return (
    <View
      className={`
        ${getVariantStyles()}
        ${getPaddingStyles()}
        rounded-2xl
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </View>
  );
}
