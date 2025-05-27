import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useChatContext } from '@/contexts/ChatContext';

interface ChatBadgeProps {
  size?: number;
}

export const ChatBadge: React.FC<ChatBadgeProps> = ({ size = 18 }) => {
  const { unreadCount } = useChatContext();

  if (unreadCount === 0) {
    return null;
  }

  // Format the count for display (e.g., show 9+ if more than 9)
  const displayCount = unreadCount > 9 ? '9+' : unreadCount.toString();

  return (
    <View style={[
      styles.badge,
      { 
        width: size, 
        height: size,
        borderRadius: size / 2,
        // Adjust position for larger numbers
        right: displayCount.length > 1 ? -6 : -4,
      }
    ]}>
      <Text style={styles.badgeText}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    backgroundColor: '#CC0000', // Red badge
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ChatBadge;
