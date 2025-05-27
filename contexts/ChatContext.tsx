import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the context type
interface ChatContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
}

// Create the context with default values
const ChatContext = createContext<ChatContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
  incrementUnreadCount: () => {},
  resetUnreadCount: () => {},
});

// Custom hook to use the chat context
export const useChatContext = () => useContext(ChatContext);

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread count from storage on mount
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const storedCount = await AsyncStorage.getItem('unread_chat_count');
        if (storedCount !== null) {
          setUnreadCount(parseInt(storedCount, 10));
        }
      } catch (error) {
        console.error('Error loading unread chat count:', error);
      }
    };

    loadUnreadCount();
  }, []);

  // Save unread count to storage whenever it changes
  useEffect(() => {
    const saveUnreadCount = async () => {
      try {
        await AsyncStorage.setItem('unread_chat_count', unreadCount.toString());
      } catch (error) {
        console.error('Error saving unread chat count:', error);
      }
    };

    saveUnreadCount();
  }, [unreadCount]);

  // Increment the unread count
  const incrementUnreadCount = () => {
    setUnreadCount(prevCount => prevCount + 1);
  };

  // Reset the unread count to zero
  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  return (
    <ChatContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        incrementUnreadCount,
        resetUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
