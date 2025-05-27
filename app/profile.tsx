import AppHeader from '@/components/AppHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock user data
const mockUser = {
  id: '123',
  name: 'Coach Smith',
  email: 'coach.smith@namibiahockey.com',
  role: 'Coach',
  team: 'Windhoek Warriors',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  phone: '+264 81 123 4567',
  notifications: {
    matches: true,
    teamUpdates: true,
    chat: true,
    news: false,
  }
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState(mockUser);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [notifications, setNotifications] = useState(user.notifications);

  const handleSave = () => {
    setUser({
      ...user,
      name,
      email,
      phone,
      notifications
    });
    setEditing(false);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key]
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <AppHeader 
        title="Profile" 
        leftButton={{
          icon: 'chevron.left',
          onPress: () => router.back()
        }}
        rightButton={
          editing 
            ? { label: 'Save', onPress: handleSave }
            : { icon: 'pencil', onPress: () => setEditing(true) }
        }
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user.avatar }} 
              style={styles.avatar} 
            />
            {editing && (
              <TouchableOpacity style={styles.editAvatarButton}>
                <IconSymbol name="camera.fill" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.userInfo}>
            {editing ? (
              <TextInput
                style={[styles.nameInput, { color: Colors[colorScheme ?? 'light'].text }]}
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
                placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
              />
            ) : (
              <ThemedText style={styles.userName}>{user.name}</ThemedText>
            )}
            <ThemedText style={styles.userRole}>{user.role} • {user.team}</ThemedText>
          </View>
        </View>
        
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>
          
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>Email</ThemedText>
            {editing ? (
              <TextInput
                style={[styles.fieldInput, { color: Colors[colorScheme ?? 'light'].text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Your Email"
                placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
                keyboardType="email-address"
              />
            ) : (
              <ThemedText style={styles.fieldValue}>{user.email}</ThemedText>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>Phone</ThemedText>
            {editing ? (
              <TextInput
                style={[styles.fieldInput, { color: Colors[colorScheme ?? 'light'].text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Your Phone"
                placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
                keyboardType="phone-pad"
              />
            ) : (
              <ThemedText style={styles.fieldValue}>{user.phone}</ThemedText>
            )}
          </View>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Notification Settings</ThemedText>
          
          <View style={styles.switchContainer}>
            <ThemedText style={styles.switchLabel}>Match Updates</ThemedText>
            <Switch
              value={notifications.matches}
              onValueChange={() => toggleNotification('matches')}
              disabled={!editing}
              trackColor={{ 
                false: '#767577', 
                true: Colors[colorScheme ?? 'light'].tint 
              }}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <ThemedText style={styles.switchLabel}>Team Updates</ThemedText>
            <Switch
              value={notifications.teamUpdates}
              onValueChange={() => toggleNotification('teamUpdates')}
              disabled={!editing}
              trackColor={{ 
                false: '#767577', 
                true: Colors[colorScheme ?? 'light'].tint 
              }}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <ThemedText style={styles.switchLabel}>Chat Messages</ThemedText>
            <Switch
              value={notifications.chat}
              onValueChange={() => toggleNotification('chat')}
              disabled={!editing}
              trackColor={{ 
                false: '#767577', 
                true: Colors[colorScheme ?? 'light'].tint 
              }}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <ThemedText style={styles.switchLabel}>News & Announcements</ThemedText>
            <Switch
              value={notifications.news}
              onValueChange={() => toggleNotification('news')}
              disabled={!editing}
              trackColor={{ 
                false: '#767577', 
                true: Colors[colorScheme ?? 'light'].tint 
              }}
            />
          </View>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <TouchableOpacity style={styles.logoutButton}>
            <IconSymbol name="arrow.right.square" size={20} color={Colors[colorScheme ?? 'light'].secondary} />
            <Text style={[styles.logoutText, { color: Colors[colorScheme ?? 'light'].secondary }]}>
              Log Out
            </Text>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.tint,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    opacity: 0.7,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.05)',
    minWidth: 200,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.7,
  },
  fieldValue: {
    fontSize: 16,
  },
  fieldInput: {
    fontSize: 16,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
