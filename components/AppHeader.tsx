import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showLogo = true,
}) => {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      {showLogo && (
        <ExpoImage
          source={require('@/assets/images/hockey.jpg')}
          style={styles.logo}
          contentFit="contain"
        />
      )}
      <View style={styles.textContainer}>
        {title && (
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default AppHeader;
