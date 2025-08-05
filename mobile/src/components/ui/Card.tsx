import React from 'react';
import { View, ViewStyle, ViewProps } from 'react-native';
import { COLORS } from '../../constants/colors';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  padding?: number;
  margin?: number;
}

export default function Card({
  children,
  className = '',
  padding = 16,
  margin = 0,
  style,
  ...props
}: CardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding,
    margin,
    shadowColor: COLORS.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  };

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
}