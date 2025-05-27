import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/context/ThemeContext';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import NotificationService from '@/services/NotificationService';
import LocationService from '@/services/LocationService';
import AppHeader from '@/components/AppHeader';

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const { theme, isDarkMode, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Load user data from AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userJson = await AsyncStorage.getItem('supabase.auth.user');
        if (userJson) {
          const parsedUser = JSON.parse(userJson);
          console.log('Loaded user data from AsyncStorage:', parsedUser);
          setUserData(parsedUser);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  // Handle dark mode toggle
  const handleThemeChange = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };
  
  // Handle notifications toggle
  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      await NotificationService.registerForPushNotifications();
      // Send a test notification
      await NotificationService.sendImmediateNotification({
        title: 'Notifications Enabled',
        body: 'You will now receive updates about matches, goals, and events.',
      });
    } else {
      await NotificationService.cancelAllNotifications();
    }
  };
  
  // Handle location services toggle
  const handleLocationToggle = async (value: boolean) => {
    setLocationEnabled(value);
    if (value) {
      const hasPermission = await LocationService.requestLocationPermissions();
      if (hasPermission) {
        LocationService.startLocationTracking();
        Alert.alert(
          'Location Services Enabled',
          'You will now receive alerts about nearby hockey matches and events.'
        );
      } else {
        setLocationEnabled(false);
      }
    } else {
      LocationService.stopLocationTracking();
    }
  };

  // Use actual user data or fallback to default values
  const displayName = userData?.user_metadata?.display_name || userData?.display_name || 'Hockey User';
  const email = userData?.email || 'No email available';
  const role = userData?.user_metadata?.role || 'Player';
  const team = userData?.user_metadata?.team || 'Not assigned';
  const memberSince = userData?.created_at ? new Date(userData.created_at).getFullYear().toString() : '2023';
  const profileImage = userData?.user_metadata?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg';

  // Generate unique QR code data for the user
  const qrCodeData = `NamibiaHockey:${role}:${displayName}:${team}:${userData?.id || Date.now()}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <AppHeader title="Profile" />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.profileCard, { 
          backgroundColor: Colors[colorScheme ?? 'light'].card,
          borderColor: Colors[colorScheme ?? 'light'].border
        }]}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} style={{ margin: 20 }} />
          ) : (
            <View style={styles.profileHeader}>
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {displayName}
                </Text>
                <Text style={[styles.profileRole, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                  {role} • {team}
                </Text>
                <Text style={[styles.profileEmail, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                  {email}
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.membershipInfo}>
            <Text style={[styles.membershipText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              Member since {memberSince}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.qrCodeCard, { 
          backgroundColor: Colors[colorScheme ?? 'light'].card,
          borderColor: Colors[colorScheme ?? 'light'].border
        }]}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            QR Code Check-in
          </Text>
          <Text style={[styles.sectionDescription, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            Use this QR code to check in at matches and events
          </Text>
          <QRCodeGenerator
            value={qrCodeData}
            size={200}
          />
        </View>

        <View style={[styles.settingsCard, { 
          backgroundColor: Colors[colorScheme ?? 'light'].card,
          borderColor: Colors[colorScheme ?? 'light'].border
        }]}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Settings
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <IconSymbol size={20} name="moon.fill" color={Colors[colorScheme ?? 'light'].text} />
              <Text style={[styles.settingLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleThemeChange}
              trackColor={{ false: '#767577', true: Colors.light.tint }}
              thumbColor={'#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <IconSymbol size={20} name="bell.fill" color={Colors[colorScheme ?? 'light'].text} />
              <Text style={[styles.settingLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                Push Notifications
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#767577', true: Colors.light.tint }}
              thumbColor={'#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <IconSymbol size={20} name="location.fill" color={Colors[colorScheme ?? 'light'].text} />
              <Text style={[styles.settingLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                Location Services
              </Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationToggle}
              trackColor={{ false: '#767577', true: Colors.light.tint }}
              thumbColor={'#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.actionsCard, { 
          backgroundColor: Colors[colorScheme ?? 'light'].card,
          borderColor: Colors[colorScheme ?? 'light'].border
        }]}>
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionLabelContainer}>
              <IconSymbol size={20} name="questionmark.circle.fill" color={Colors[colorScheme ?? 'light'].text} />
              <Text style={[styles.actionLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                Help & Support
              </Text>
            </View>
            <IconSymbol size={16} name="chevron.right" color={Colors[colorScheme ?? 'light'].tabIconDefault} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionLabelContainer}>
              <IconSymbol size={20} name="lock.fill" color={Colors[colorScheme ?? 'light'].text} />
              <Text style={[styles.actionLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                Privacy Policy
              </Text>
            </View>
            <IconSymbol size={16} name="chevron.right" color={Colors[colorScheme ?? 'light'].tabIconDefault} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionLabelContainer}>
              <IconSymbol size={20} name="doc.text.fill" color={Colors[colorScheme ?? 'light'].text} />
              <Text style={[styles.actionLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                Terms of Service
              </Text>
            </View>
            <IconSymbol size={16} name="chevron.right" color={Colors[colorScheme ?? 'light'].tabIconDefault} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.logoutButton, { borderColor: Colors[colorScheme ?? 'light'].border }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutButtonText, { color: '#FF3B30' }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileCard: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  membershipInfo: {
    marginBottom: 16,
  },
  membershipText: {
    fontSize: 14,
  },
  editButton: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  qrCodeCard: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  qrCode: {
    width: 200,
    height: 200,
    marginVertical: 8,
  },
  settingsCard: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  actionsCard: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  actionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
