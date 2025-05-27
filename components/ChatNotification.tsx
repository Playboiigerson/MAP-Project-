import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useChatContext } from '@/contexts/ChatContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ChatNotificationProps {
  message: string;
  sender: string;
  onDismiss: () => void;
}

export const ChatNotification: React.FC<ChatNotificationProps> = ({ 
  message, 
  sender, 
  onDismiss 
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const [animation] = useState(new Animated.Value(0));
  
  // Animate the notification in and out
  useEffect(() => {
    // Animate in
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Auto dismiss after 5 seconds
    const timeout = setTimeout(() => {
      handleDismiss();
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  const handleDismiss = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };
  
  const handlePress = () => {
    onDismiss();
    router.push('/(tabs)/chat');
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          backgroundColor: Colors[colorScheme].card,
          borderColor: Colors[colorScheme].border,
          transform: [
            { translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0]
              })
            }
          ],
          opacity: animation
        }
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={handlePress}>
        <View style={styles.iconContainer}>
          <IconSymbol name="bubble.left.fill" size={24} color={Colors[colorScheme].tint} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.sender, { color: Colors[colorScheme].text }]}>
            {sender}
          </Text>
          <Text 
            style={[styles.message, { color: Colors[colorScheme].text }]}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
        <IconSymbol name="xmark.circle.fill" size={20} color={Colors[colorScheme].tabIconDefault} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    margin: 10,
    marginTop: 60, // Adjust based on your header height
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  sender: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default ChatNotification;
