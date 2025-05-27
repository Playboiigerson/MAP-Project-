import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useChatContext } from '@/contexts/ChatContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeAnnouncementsDatabase } from '@/services/initializeAnnouncements';
import { Announcement, Reply, announcementService } from '@/services/supabaseRest';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Simple icon component using SF Symbols naming convention
const IconSymbol = ({ name, size, color, style }: { name: string, size: number, color: string, style?: any }) => {
  // Map SF Symbol names to Ionicons
  const iconMap: {[key: string]: string} = {
    'bell.fill': 'notifications',
    'link': 'link',
    'ellipsis': 'ellipsis-vertical',
    'chevron.left': 'chevron-back',
    'arrow.up.circle.fill': 'arrow-up-circle',
    'checkmark.circle.fill': 'checkmark-circle',
    'heart': 'heart-outline',
    'heart.fill': 'heart',
    'chat.bubble': 'chatbubble-outline',
    'chat.bubble.fill': 'chatbubble',
    'thumbs.up': 'thumbs-up-outline',
    'thumbs.up.fill': 'thumbs-up',
    'person.circle': 'person-circle-outline',
    'person.circle.fill': 'person-circle',
    'plus': 'add',
    'xmark': 'close',
    'trash': 'trash'
  };

  const ionIconName = iconMap[name] || 'help-circle';
  
  return (
    <Ionicons name={ionIconName as any} size={size} color={color} style={style} />
  );
};

export default function AnnouncementsScreen() {
  const colorScheme = useColorScheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { resetUnreadCount } = useChatContext();
  const { user } = useAuth();
  const [dbInitialized, setDbInitialized] = useState(false);
  
  // New state for creating announcements
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  // Initialize database when component mounts
  useEffect(() => {
    const initDatabase = async () => {
      try {
        await initializeAnnouncementsDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error('Error initializing database:', error);
        setDbInitialized(true); // Still mark as initialized to prevent infinite retries
      }
    };
    
    initDatabase();
  }, []);

  // Fetch announcements on component mount and when database is initialized
  useEffect(() => {
    if (dbInitialized) {
      fetchAnnouncements();
      resetUnreadCount();
      
      const intervalId = setInterval(() => {
        fetchAnnouncements(false);
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [resetUnreadCount, dbInitialized]);

  const fetchAnnouncements = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const data = await announcementService.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      Alert.alert('Error', 'Failed to load announcements. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncementText.trim()) return;
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to create announcements.');
      return;
    }
    
    setCreatingAnnouncement(true);
    
    try {
      const newAnnouncement = {
        sender_id: user.id,
        sender_name: user.user_metadata?.name || user.email || 'Anonymous User',
        message: newAnnouncementText.trim()
      };
      
      const createdAnnouncement = await announcementService.createAnnouncement(newAnnouncement);
      
      if (createdAnnouncement) {
        // Update local state to show the new announcement immediately
        setAnnouncements(prevAnnouncements => [createdAnnouncement, ...prevAnnouncements]);
        setNewAnnouncementText('');
        setCreateModalVisible(false);
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement. Please try again.');
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const handleLikeAnnouncement = async (id: string) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to like announcements.');
      return;
    }
    
    try {
      const success = await announcementService.likeAnnouncement(id, user.id);
      
      if (success) {
        // Update local state to reflect changes immediately
        setAnnouncements(prevAnnouncements => 
          prevAnnouncements.map(announcement => {
            if (announcement.id === id) {
              const wasLiked = (announcement.liked_by_ids || []).includes(user.id);
              return {
                ...announcement,
                likes: wasLiked ? Math.max(0, announcement.likes - 1) : (announcement.likes || 0) + 1,
                liked_by_ids: wasLiked 
                  ? (announcement.liked_by_ids || []).filter(uid => uid !== user.id) 
                  : [...(announcement.liked_by_ids || []), user.id],
                liked_by_user: !wasLiked
              };
            }
            return announcement;
          })
        );
      }
    } catch (error) {
      console.error('Error liking announcement:', error);
      Alert.alert('Error', 'Failed to like announcement. Please try again.');
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeReplyId) return;
    
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to reply to announcements.');
      return;
    }
    
    try {
      const newReply: Partial<Reply> = {
        announcement_id: activeReplyId,
        sender_id: user.id,
        sender_name: user.user_metadata?.name || user.email || 'Anonymous User',
        message: replyText.trim()
      };
      
      const createdReply = await announcementService.addReply(newReply);
      
      if (createdReply) {
        // Update local state
        setAnnouncements(prevAnnouncements => 
          prevAnnouncements.map(announcement => {
            if (announcement.id === activeReplyId) {
              return {
                ...announcement,
                replies: [...(announcement.replies || []), createdReply]
              };
            }
            return announcement;
          })
        );
        
        setReplyText('');
        setActiveReplyId(null);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      Alert.alert('Error', 'Failed to send reply. Please try again.');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      // Format: Feb 14, 2023
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  const renderReply = ({ item }: { item: Reply }) => {
    return (
      <View style={[
        styles.replyContainer,
        { backgroundColor: Colors[colorScheme ?? 'light'].card }
      ]}>
        <View style={styles.replyHeader}>
          <Text style={[
            styles.replySenderName, 
            { 
              color: item.is_admin 
                ? Colors[colorScheme ?? 'light'].primary 
                : Colors[colorScheme ?? 'light'].text 
            }
          ]}>
            {item.sender_name} {item.is_admin && '(Admin)'}
          </Text>
          <Text style={[styles.replyTime, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
        <Text style={[styles.replyText, { color: Colors[colorScheme ?? 'light'].text }]}>
          {item.message}
        </Text>
      </View>
    );
  };

  const renderAnnouncement = ({ item }: { item: Announcement }) => {
    const isReplying = activeReplyId === item.id;
    const isLikedByUser = user ? (item.liked_by_ids || []).includes(user.id) : false;
    const isUserAdmin = user?.user_metadata?.is_admin === true;
    const isAnnouncementOwner = user && (user.id === item.sender_id || user.email === item.sender_name);
    const canDelete = isUserAdmin || isAnnouncementOwner;
    
    const handleDeleteAnnouncement = async () => {
      Alert.alert(
        'Delete Announcement',
        'Are you sure you want to delete this announcement?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const success = await announcementService.deleteAnnouncement(item.id);
                if (success) {
                  // Remove from local state
                  setAnnouncements(prevAnnouncements => 
                    prevAnnouncements.filter(a => a.id !== item.id)
                  );
                }
              } catch (error) {
                console.error('Error deleting announcement:', error);
                Alert.alert('Error', 'Failed to delete announcement. Please try again.');
              }
            }
          }
        ]
      );
    };
    
    return (
      <View style={[
        styles.announcementContainer,
        { backgroundColor: Colors[colorScheme ?? 'light'].background }
      ]}>
        {/* Announcement Header */}
        <View style={styles.announcementHeader}>
          <View style={styles.senderInfo}>
            <View style={[
              styles.avatarContainer, 
              { backgroundColor: Colors[colorScheme ?? 'light'].primary }
            ]}>
              <Text style={styles.avatarText}>
                {item.sender_name.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={[styles.senderName, { color: Colors[colorScheme ?? 'light'].text }]}>
                {item.sender_name}
              </Text>
              <Text style={[styles.timestamp, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
          
          {canDelete && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDeleteAnnouncement}
            >
              <IconSymbol name="trash" size={20} color="#ff3b30" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Announcement Content */}
        <View style={styles.messageContent}>
          <Text style={[styles.messageText, { color: Colors[colorScheme ?? 'light'].text }]}>
            {item.message}
          </Text>
        </View>
        
        {/* Announcement Actions */}
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLikeAnnouncement(item.id)}
          >
            <IconSymbol 
              name={isLikedByUser ? 'heart.fill' : 'heart'} 
              size={20} 
              color={isLikedByUser ? '#e91e63' : Colors[colorScheme ?? 'light'].tabIconDefault} 
            />
            <Text style={[
              styles.actionText, 
              { 
                color: isLikedByUser 
                  ? '#e91e63' 
                  : Colors[colorScheme ?? 'light'].tabIconDefault 
              }
            ]}>
              {item.likes || 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setActiveReplyId(isReplying ? null : item.id)}
          >
            <IconSymbol 
              name={isReplying ? 'chat.bubble.fill' : 'chat.bubble'} 
              size={20} 
              color={isReplying 
                ? Colors[colorScheme ?? 'light'].primary 
                : Colors[colorScheme ?? 'light'].tabIconDefault
              } 
            />
            <Text style={[
              styles.actionText, 
              { 
                color: isReplying 
                  ? Colors[colorScheme ?? 'light'].primary 
                  : Colors[colorScheme ?? 'light'].tabIconDefault 
              }
            ]}>
              {item.replies?.length || 0}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Replies Section */}
        {item.replies && item.replies.length > 0 && (
          <View style={styles.repliesSection}>
            <FlatList
              data={item.replies}
              renderItem={renderReply}
              keyExtractor={(reply) => reply.id}
              scrollEnabled={false}
            />
          </View>
        )}
        
        {/* Reply Input */}
        {isReplying && (
          <View style={[
            styles.replyInputContainer, 
            { 
              backgroundColor: Colors[colorScheme ?? 'light'].card,
              borderColor: Colors[colorScheme ?? 'light'].border 
            }
          ]}>
            <TextInput
              style={[
                styles.replyInput,
                { 
                  color: Colors[colorScheme ?? 'light'].text,
                  backgroundColor: Colors[colorScheme ?? 'light'].background 
                }
              ]}
              placeholder="Type your reply..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { 
                  backgroundColor: replyText.trim() 
                    ? Colors[colorScheme ?? 'light'].primary 
                    : Colors[colorScheme ?? 'light'].border
                }
              ]}
              onPress={handleSendReply}
              disabled={!replyText.trim()}
            >
              <IconSymbol name="arrow.up.circle.fill" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements(false);
  };

  return (
    <SafeAreaView style={[
      styles.container, 
      { backgroundColor: Colors[colorScheme ?? 'light'].background }
    ]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Channel Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: Colors[colorScheme ?? 'light'].card,
          borderBottomColor: Colors[colorScheme ?? 'light'].border 
        }
      ]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          <View style={[
            styles.channelAvatar,
            { backgroundColor: Colors[colorScheme ?? 'light'].primary }
          ]}>
            <Text style={styles.channelAvatarText}>H</Text>
          </View>
          <View style={styles.channelInfo}>
            <Text style={[styles.channelName, { color: Colors[colorScheme ?? 'light'].text }]}>
              Hockey Updates
            </Text>
            <Text style={[styles.channelDescription, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              Official Announcements Channel
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {user && (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <IconSymbol name="plus" size={24} color={Colors[colorScheme ?? 'light'].primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerButton}>
            <IconSymbol name="bell.fill" size={24} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <IconSymbol name="ellipsis" size={24} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Announcements List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
          <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Loading announcements...
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={announcements}
          renderItem={renderAnnouncement}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { flexGrow: 1, justifyContent: 'flex-end' }]}
          showsVerticalScrollIndicator={false}
          inverted
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors[colorScheme ?? 'light'].primary]}
              tintColor={Colors[colorScheme ?? 'light'].primary}
            />
          }
        />
      )}
      
      {/* Create Announcement Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={[
            styles.modalContent,
            { backgroundColor: Colors[colorScheme ?? 'light'].background }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Create Announcement
              </Text>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                style={styles.closeButton}
              >
                <IconSymbol name="xmark" size={24} color={Colors[colorScheme ?? 'light'].text} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[
                styles.announcementInput,
                { 
                  color: Colors[colorScheme ?? 'light'].text,
                  backgroundColor: Colors[colorScheme ?? 'light'].card 
                }
              ]}
              placeholder="Write your announcement..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={newAnnouncementText}
              onChangeText={setNewAnnouncementText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            
            <TouchableOpacity
              style={[
                styles.createButton,
                { 
                  backgroundColor: newAnnouncementText.trim() 
                    ? Colors[colorScheme ?? 'light'].primary 
                    : Colors[colorScheme ?? 'light'].border,
                  opacity: creatingAnnouncement ? 0.7 : 1
                }
              ]}
              onPress={handleCreateAnnouncement}
              disabled={!newAnnouncementText.trim() || creatingAnnouncement}
            >
              {creatingAnnouncement ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Post Announcement</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  channelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  channelInfo: {
    justifyContent: 'center',
  },
  channelName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  channelDescription: {
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 8,
  },
  announcementContainer: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  senderName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  timestamp: {
    fontSize: 12,
  },
  messageContent: {
    padding: 12,
    paddingTop: 0,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
  },
  repliesSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  replyContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  replySenderName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  replyTime: {
    fontSize: 12,
  },
  replyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
  },
  replyInput: {
    flex: 1,
    borderRadius: 20,
    padding: 10,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // New styles for create announcement modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  announcementInput: {
    borderRadius: 10,
    padding: 15,
    minHeight: 120,
    marginBottom: 20,
  },
  createButton: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    padding: 5,
  },
});
