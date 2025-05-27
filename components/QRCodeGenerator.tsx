import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  title?: string;
  description?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  size = 200,
  title,
  description,
}) => {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const color = Colors[colorScheme ?? 'light'].text;

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          {title}
        </Text>
      )}
      
      {description && (
        <Text style={[styles.description, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
          {description}
        </Text>
      )}
      
      <View style={[styles.qrContainer, { backgroundColor }]}>
        <QRCode
          value={value}
          size={size}
          color={color}
          backgroundColor={backgroundColor}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 16,
    borderRadius: 8,
  },
});

export default QRCodeGenerator;
