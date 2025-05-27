import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ExpoImage
        source={require('@/assets/images/hockey.jpg')}
        style={styles.logo}
        contentFit="contain"
      />
      <Text style={styles.title}>NAMIBIA HOCKEY UNION</Text>
      <Text style={styles.subtitle}>Mobile App</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003366', // Namibia Hockey blue
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700', // Gold color
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF', // White
    marginTop: 10,
    textAlign: 'center',
  },
});

export default SplashScreen;
