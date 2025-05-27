import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useChatContext } from '@/contexts/ChatContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Mock data for featured matches
const featuredMatches = [
  {
    id: '1',
    homeTeam: 'Windhoek Warriors',
    homeTeamLogo: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    awayTeam: 'Swakopmund Strikers',
    awayTeamLogo: 'https://images.unsplash.com/photo-1607457561901-e6ec3a6d16cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    date: '2025-05-25',
    time: '15:00',
    location: 'Windhoek Stadium',
    isFeatured: true,
  },
  {
    id: '2',
    homeTeam: 'Walvis Bay Wolves',
    homeTeamLogo: 'https://images.unsplash.com/photo-1519766304817-4f37bda74b38?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    awayTeam: 'Otjiwarongo Owls',
    awayTeamLogo: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    date: '2025-05-26',
    time: '14:30',
    location: 'Walvis Bay Sports Ground',
    isFeatured: true,
  },
];

// Mock data for upcoming matches
const upcomingMatches = [
  {
    id: '3',
    homeTeam: 'Windhoek Warriors',
    awayTeam: 'Walvis Bay Wolves',
    date: '2025-05-28',
    time: '15:00',
    location: 'Windhoek Stadium',
  },
  {
    id: '4',
    homeTeam: 'Swakopmund Strikers',
    awayTeam: 'Otjiwarongo Owls',
    date: '2025-05-30',
    time: '14:30',
    location: 'Swakopmund Sports Complex',
  },
  {
    id: '5',
    homeTeam: 'Keetmanshoop Kings',
    awayTeam: 'Rundu Rangers',
    date: '2025-06-02',
    time: '16:00',
    location: 'Keetmanshoop Stadium',
  },
];

// Mock data for news items
const newsItems = [
  {
    id: '1',
    title: 'National Championship Finals Announced',
    summary: 'The finals will be held on June 15th at Windhoek Stadium',
    image: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    date: '2025-05-20',
  },
  {
    id: '2',
    title: 'Youth Development Program Launches',
    summary: 'New initiative to discover and nurture young hockey talent across Namibia',
    image: 'https://images.unsplash.com/photo-1607457561901-e6ec3a6d16cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    date: '2025-05-18',
  },
  {
    id: '3',
    title: 'National Team Selection Announced',
    summary: 'Coach reveals squad for upcoming international tournament',
    image: 'https://images.unsplash.com/photo-1519766304817-4f37bda74b38?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    date: '2025-05-15',
  },
];

// Mock data for quick access items
const quickAccessItems = [
  {
    id: '1',
    title: 'Fixtures',
    icon: 'calendar',
    route: '/(tabs)/events',
  },
  {
    id: '2',
    title: 'Teams',
    icon: 'person.3.fill',
    route: '/(tabs)/teams',
  },
  {
    id: '3',
    title: 'Players',
    icon: 'person.fill',
    route: '/(tabs)/players',
  },
  {
    id: '4',
    title: 'Chat',
    icon: 'bubble.left.fill',
    route: '/(tabs)/chat',
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const { incrementUnreadCount } = useChatContext();
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // Auto-cycle through featured matches
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeaturedIndex(prev => 
        prev === featuredMatches.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle navigation with haptic feedback
  const handleNavigation = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header with profile icon */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Namibia Hockey</Text>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <View style={[styles.profileIcon, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}>
              <IconSymbol size={24} name="person.crop.circle" color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main content */}
      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Featured Match Card */}
        <View style={styles.featuredContainer}>
          <View style={[styles.featuredCard, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}>
            <Text style={styles.featuredLabel}>FEATURED MATCH</Text>
            <View style={styles.featuredTeams}>
              <View style={styles.teamContainer}>
                <View style={[styles.teamLogoContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                  <ExpoImage 
                    source={{ uri: featuredMatches[currentFeaturedIndex].homeTeamLogo }} 
                    style={styles.teamLogo} 
                  />
                </View>
                <Text style={styles.teamName} numberOfLines={1}>
                  {featuredMatches[currentFeaturedIndex].homeTeam}
                </Text>
              </View>
              
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
                <Text style={styles.matchDate}>
                  {formatDate(featuredMatches[currentFeaturedIndex].date)}
                </Text>
                <Text style={styles.matchTime}>
                  {featuredMatches[currentFeaturedIndex].time}
                </Text>
              </View>
              
              <View style={styles.teamContainer}>
                <View style={[styles.teamLogoContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                  <ExpoImage 
                    source={{ uri: featuredMatches[currentFeaturedIndex].awayTeamLogo }} 
                    style={styles.teamLogo} 
                  />
                </View>
                <Text style={styles.teamName} numberOfLines={1}>
                  {featuredMatches[currentFeaturedIndex].awayTeam}
                </Text>
              </View>
            </View>
            
            <View style={styles.locationContainer}>
              <IconSymbol name="mappin" size={14} color="white" />
              <Text style={styles.locationText}>
                {featuredMatches[currentFeaturedIndex].location}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.ticketButton, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            >
              <Text style={[styles.ticketButtonText, { color: Colors[colorScheme ?? 'light'].primary }]}>
                Get Tickets
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Pagination dots */}
          <View style={styles.paginationContainer}>
            {featuredMatches.map((_, index) => (
              <View 
                key={index} 
                style={[styles.paginationDot, { 
                  backgroundColor: index === currentFeaturedIndex 
                    ? Colors[colorScheme ?? 'light'].primary 
                    : Colors[colorScheme ?? 'light'].border 
                }]} 
              />
            ))}
          </View>
        </View>
        
        {/* Quick Access Buttons */}
        <View style={styles.quickAccessContainer}>
          {quickAccessItems.map(item => (
            <TouchableOpacity 
              key={item.id}
              style={[styles.quickAccessButton, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}
              onPress={() => handleNavigation(item.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: Colors[colorScheme ?? 'light'].highlight }]}>
                <IconSymbol name={item.icon} size={22} color={Colors[colorScheme ?? 'light'].primary} />
              </View>
              <Text style={[styles.quickAccessText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { 
            backgroundColor: Colors[colorScheme ?? 'light'].card,
            borderColor: Colors[colorScheme ?? 'light'].border
          }]}>
            <IconSymbol size={20} name="magnifyingglass" color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <TextInput
              style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Search teams, players, matches..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Upcoming Matches Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Upcoming Matches</Text>
            <TouchableOpacity onPress={() => handleNavigation('/(tabs)/events')}>
              <Text style={[styles.viewAllText, { color: Colors[colorScheme ?? 'light'].primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingMatches.map(match => (
            <TouchableOpacity 
              key={match.id} 
              style={[styles.upcomingMatchCard, { 
                backgroundColor: Colors[colorScheme ?? 'light'].card,
                borderColor: Colors[colorScheme ?? 'light'].border
              }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={styles.matchDateContainer}>
                <Text style={[styles.matchDay, { color: Colors[colorScheme ?? 'light'].primary }]}>
                  {formatDate(match.date)}
                </Text>
                <Text style={[styles.matchTime, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {match.time}
                </Text>
              </View>

              <View style={styles.matchTeamsContainer}>
                <Text style={[styles.matchTeamName, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={1}>
                  {match.homeTeam}
                </Text>
                <Text style={[styles.matchVs, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>vs</Text>
                <Text style={[styles.matchTeamName, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={1}>
                  {match.awayTeam}
                </Text>
              </View>

              <View style={styles.matchLocationContainer}>
                <IconSymbol size={14} name="mappin" color={Colors[colorScheme ?? 'light'].tabIconDefault} />
                <Text style={[styles.matchLocationText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                  {match.location}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Latest News Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Latest News</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: Colors[colorScheme ?? 'light'].primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {newsItems.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.newsCard, { 
                backgroundColor: Colors[colorScheme ?? 'light'].card,
                borderColor: Colors[colorScheme ?? 'light'].border
              }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <ExpoImage source={{ uri: item.image }} style={styles.newsImage} />
              <View style={styles.newsContent}>
                <Text style={[styles.newsTitle, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.newsSummary, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]} numberOfLines={2}>
                  {item.summary}
                </Text>
                <Text style={[styles.newsDate, { color: Colors[colorScheme ?? 'light'].primary }]}>
                  {formatDate(item.date)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.ScrollView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  featuredContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 24,
  },
  featuredCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuredTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamContainer: {
    alignItems: 'center',
    width: '35%',
  },
  teamLogoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  teamLogo: {
    width: '100%',
    height: '100%',
  },
  teamName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    width: '30%',
  },
  vsText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  matchDate: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
  },
  matchTime: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  locationText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  ticketButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  ticketButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickAccessButton: {
    width: '22%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  upcomingMatchCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  matchDateContainer: {
    marginBottom: 12,
  },
  matchDay: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  matchTime: {
    fontSize: 14,
  },
  matchTeamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTeamName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchVs: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  matchLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchLocationText: {
    fontSize: 14,
    marginLeft: 4,
  },
  newsCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  newsImage: {
    width: 100,
    height: 100,
  },
  newsContent: {
    flex: 1,
    padding: 12,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  newsSummary: {
    fontSize: 14,
    marginBottom: 8,
  },
  newsDate: {
    fontSize: 12,
    fontWeight: '500',
  },
});
